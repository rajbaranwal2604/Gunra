import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  college: string;
  created_at: string;
};

export type Game = {
  id: string;
  title: string;
  description: string;
  slug: string;
  icon_name: string;
  created_at: string;
};

export type GameScore = {
  id: string;
  game_id: string;
  user_id: string;
  score: number;
  created_at: string;
  profiles?: Pick<Profile, 'username' | 'avatar_url' | 'full_name'>;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, 'username' | 'avatar_url' | 'full_name'>;
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, 'username' | 'avatar_url' | 'full_name'>;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};
