import { useState, useEffect, useCallback } from 'react';
import { supabase, type Profile, type GameScore } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Edit2, Save, X, Trophy, Users, UserMinus, UserPlus, Gamepad2 } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

type FollowUser = Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name' | 'college' | 'bio'>;

export default function ProfilePage({ viewUserId }: { viewUserId?: string }) {
  const { user, profile, refreshProfile } = useAuth();
  const isOwnProfile = !viewUserId || viewUserId === user?.id;
  const targetId = viewUserId || user?.id;

  const [viewProfile, setViewProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', college: '', avatar_url: '' });
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [myScores, setMyScores] = useState<GameScore[]>([]);
  const [gameTitles, setGameTitles] = useState<Record<string, string>>({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'posts' | 'followers' | 'following' | 'stats'>('stats');

  const loadProfile = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);

    if (isOwnProfile && profile) {
      setViewProfile(profile);
      setEditForm({ full_name: profile.full_name, bio: profile.bio, college: profile.college, avatar_url: profile.avatar_url });
    } else {
      const { data } = await supabase.from('profiles').select('*').eq('id', targetId).maybeSingle();
      setViewProfile(data as Profile | null);
    }

    // Followers (people following targetId)
    const { data: followersData } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(id, username, avatar_url, full_name, college, bio)')
      .eq('following_id', targetId);
    setFollowers((followersData as unknown as FollowUser[]) || []);

    // Following (people targetId follows)
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, avatar_url, full_name, college, bio)')
      .eq('follower_id', targetId);
    setFollowing((followingData as unknown as FollowUser[]) || []);

    // Scores
    const { data: scoresData } = await supabase
      .from('game_scores')
      .select('id, game_id, user_id, score, created_at')
      .eq('user_id', targetId)
      .order('score', { ascending: false })
      .limit(20);
    setMyScores((scoresData as GameScore[]) || []);

    // Game titles
    const { data: games } = await supabase.from('games').select('id, title');
    const titles: Record<string, string> = {};
    (games || []).forEach((g: { id: string; title: string }) => { titles[g.id] = g.title; });
    setGameTitles(titles);

    // Is current user following target?
    if (user && !isOwnProfile) {
      const { data: f } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetId)
        .maybeSingle();
      setIsFollowing(!!f);
    }

    setLoading(false);
  }, [targetId, isOwnProfile, profile, user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function saveProfile() {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editForm.full_name, bio: editForm.bio, college: editForm.college, avatar_url: editForm.avatar_url })
      .eq('id', user.id);
    if (error) {
      console.error('Profile update failed:', error.message);
      return;
    }
    await refreshProfile();
    setEditing(false);
    loadProfile();
  }

  async function toggleFollow() {
    if (!user || !targetId || isOwnProfile) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
    }
    setIsFollowing(!isFollowing);
    loadProfile();
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;
  }

  if (!viewProfile) {
    return <div className="text-center py-20 text-slate-400">Profile not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header card */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 mb-5">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-700 flex items-center justify-center text-3xl font-bold text-emerald-400 border border-slate-600 shrink-0 overflow-hidden">
            {viewProfile.avatar_url ? (
              <img src={viewProfile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              viewProfile.username.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editing && isOwnProfile ? (
              <div className="space-y-3">
                <input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <input
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  placeholder="College name"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <input
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                  placeholder="Avatar image URL"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={saveProfile} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-400 transition-colors">
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold text-white">{viewProfile.full_name || viewProfile.username}</h1>
                  <span className="text-sm text-slate-500">@{viewProfile.username}</span>
                </div>
                {viewProfile.college && <p className="text-sm text-slate-400 mt-0.5">{viewProfile.college}</p>}
                {viewProfile.bio && <p className="text-sm text-slate-300 mt-2">{viewProfile.bio}</p>}
                <p className="text-xs text-slate-600 mt-2">Joined {timeAgo(viewProfile.created_at)}</p>

                <div className="flex items-center gap-4 mt-3">
                  <button onClick={() => setTab('followers')} className="text-sm text-slate-400 hover:text-white transition-colors">
                    <span className="text-white font-semibold">{followers.length}</span> followers
                  </button>
                  <button onClick={() => setTab('following')} className="text-sm text-slate-400 hover:text-white transition-colors">
                    <span className="text-white font-semibold">{following.length}</span> following
                  </button>
                  {isOwnProfile ? (
                    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-600 transition-colors ml-auto">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                  ) : (
                    <button
                      onClick={toggleFollow}
                      className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ml-auto ${
                        isFollowing
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-emerald-500 text-white hover:bg-emerald-400'
                      }`}
                    >
                      {isFollowing ? <><UserMinus className="w-3.5 h-3.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/40 border border-slate-700/50 rounded-lg mb-5">
        {([
          { id: 'stats', label: 'Game Stats', icon: Trophy },
          { id: 'followers', label: 'Followers', icon: Users },
          { id: 'following', label: 'Following', icon: Users },
        ] as const).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-all ${
                tab === t.id ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'stats' && (
        <div>
          {myScores.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No game scores yet. Play some games!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myScores.map((s) => (
                <div key={s.id} className="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{gameTitles[s.game_id] || 'Unknown game'}</div>
                      <div className="text-xs text-slate-500">{timeAgo(s.created_at)}</div>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">{s.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'followers' && (
        <UserList users={followers} emptyText="No followers yet." />
      )}

      {tab === 'following' && (
        <UserList users={following} emptyText="Not following anyone yet." />
      )}
    </div>
  );
}

function UserList({ users, emptyText }: { users: FollowUser[]; emptyText: string }) {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 rounded-lg px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-emerald-400 border border-slate-600 overflow-hidden">
            {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : u.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">{u.full_name || u.username}</div>
            <div className="text-xs text-slate-500 truncate">@{u.username}{u.college && ` · ${u.college}`}</div>
          </div>
          <a href={`#profile:${u.id}`} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors shrink-0">
            View
          </a>
        </div>
      ))}
    </div>
  );
}
