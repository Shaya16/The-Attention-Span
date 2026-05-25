/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
  TURNSTILE_SECRET: string;
}

export interface PostStatsRow {
  slug: string;
  clap_total: number;
  comment_count: number;
}

export interface ClapRow {
  slug: string;
  visitor_id: string;
  count: number;
}

export interface CommentRow {
  id: number;
  slug: string;
  author: string;
  body: string;
  created_at: number;
  status: 'pending' | 'approved' | 'rejected';
}

export const CLAP_CAP_PER_VISITOR = 50;
export const COMMENT_MAX_LEN = 2000;
export const AUTHOR_MAX_LEN = 60;
