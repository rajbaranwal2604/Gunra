import { useState, useEffect, useCallback } from 'react';
import { supabase, type Post, type Comment } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Heart, MessageCircle, Send, Trash2, Plus } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

type PostWithMeta = Post & { like_count: number; comment_count: number; liked_by_me: boolean };

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data: postsData } = await supabase
      .from('posts')
      .select('id, user_id, content, created_at, profiles:profiles(username, avatar_url, full_name)')
      .order('created_at', { ascending: false })
      .limit(50);
    const rawPosts = (postsData as unknown as Post[]) || [];
    if (rawPosts.length === 0) { setPosts([]); setLoading(false); return; }

    const postIds = rawPosts.map((p) => p.id);

    const [{ data: likes }, { data: comments }] = await Promise.all([
      supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('comments').select('id, post_id, user_id, content, created_at, profiles:profiles(username, avatar_url, full_name)').in('post_id', postIds).order('created_at', { ascending: true }),
    ]);

    const likeMap: Record<string, number> = {};
    const likedByMe: Set<string> = new Set();
    (likes || []).forEach((l: { post_id: string; user_id: string }) => {
      likeMap[l.post_id] = (likeMap[l.post_id] || 0) + 1;
      if (l.user_id === user?.id) likedByMe.add(l.post_id);
    });

    const commentMap: Record<string, number> = {};
    const commentsGrouped: Record<string, Comment[]> = {};
    (comments as unknown as Comment[] || []).forEach((c) => {
      commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1;
      if (!commentsGrouped[c.post_id]) commentsGrouped[c.post_id] = [];
      commentsGrouped[c.post_id].push(c);
    });

    setPosts(rawPosts.map((p) => ({
      ...p,
      like_count: likeMap[p.id] || 0,
      comment_count: commentMap[p.id] || 0,
      liked_by_me: likedByMe.has(p.id),
    })));
    setCommentsByPost(commentsGrouped);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setPosting(true);
    const { error } = await supabase.from('posts').insert({ content: content.trim() });
    if (error) {
      console.error('Post failed:', error.message);
      setPosting(false);
      return;
    }
    setContent('');
    setPosting(false);
    loadPosts();
  }

  async function toggleLike(postId: string, liked: boolean) {
    if (!user) return;
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
    }
    loadPosts();
  }

  async function deletePost(postId: string) {
    if (!user) return;
    await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
    loadPosts();
  }

  async function submitComment(postId: string) {
    const text = (commentInputs[postId] || '').trim();
    if (!text || !user) return;
    const { error } = await supabase.from('comments').insert({ post_id: postId, content: text });
    if (error) { console.error('Comment failed:', error.message); return; }
    setCommentInputs({ ...commentInputs, [postId]: '' });
    loadPosts();
    setExpandedComments(new Set([...expandedComments, postId]));
  }

  async function deleteComment(commentId: string, postId: string) {
    if (!user) return;
    await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id);
    loadPosts();
  }

  function toggleComments(postId: string) {
    const next = new Set(expandedComments);
    if (next.has(postId)) next.delete(postId);
    else next.add(postId);
    setExpandedComments(next);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Community</h1>
        <p className="text-sm text-slate-400 mt-1">Share your thoughts, see what others are posting.</p>
      </div>

      {/* Compose box */}
      <form onSubmit={createPost} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 mb-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className="w-full bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!content.trim() || posting}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-40"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Post
          </button>
        </div>
      </form>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4">
              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-emerald-400 border border-slate-600 overflow-hidden">
                  {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : (post.profiles?.username?.charAt(0).toUpperCase() || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{post.profiles?.full_name || post.profiles?.username || 'Unknown'}</div>
                  <div className="text-xs text-slate-500">@{post.profiles?.username || 'unknown'} · {timeAgo(post.created_at)}</div>
                </div>
                {post.user_id === user?.id && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <p className="text-sm text-slate-200 whitespace-pre-wrap break-words mb-3">{post.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => toggleLike(post.id, post.liked_by_me)}
                  className={`flex items-center gap-1.5 transition-colors ${post.liked_by_me ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'}`}
                >
                  <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
                  <span>{post.like_count || ''}</span>
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comment_count || ''}</span>
                </button>
              </div>

              {/* Comments */}
              {expandedComments.has(post.id) && (
                <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-3">
                  {(commentsByPost[post.id] || []).map((c) => (
                    <div key={c.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400 border border-slate-600 overflow-hidden shrink-0">
                        {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : (c.profiles?.username?.charAt(0).toUpperCase() || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-slate-900/40 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">{c.profiles?.username || 'unknown'}</span>
                            <span className="text-xs text-slate-600">{timeAgo(c.created_at)}</span>
                            {c.user_id === user?.id && (
                              <button
                                onClick={() => deleteComment(c.id, post.id)}
                                className="ml-auto text-slate-500 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 mt-0.5">{c.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Comment input */}
                  <div className="flex items-center gap-2">
                    <input
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitComment(post.id); }}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      onClick={() => submitComment(post.id)}
                      className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
