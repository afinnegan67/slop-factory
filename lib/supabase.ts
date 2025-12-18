import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export interface ResearchJob {
  id: string;
  created_at: string;
  updated_at: string;
  topic: string;
  target_audience: string;
  research_depth: 'quick' | 'standard' | 'comprehensive';
  status: 'pending' | 'researching' | 'analyzing' | 'completed' | 'failed';
  raw_research: string | null;
  research_summary: string | null;
  tokens_used: number | null;
  processing_time_ms: number | null;
  error_message: string | null;
}

export interface PainAngle {
  id: string;
  created_at: string;
  research_job_id: string;
  title: string;
  description: string;
  visceral_phrase: string | null;
  category: 'financial' | 'time' | 'family' | 'stress' | 'reputation' | null;
  intensity_score: number | null;
  is_approved: boolean;
  is_archived: boolean;
  times_used: number;
}

export interface VisualHook {
  id: string;
  created_at: string;
  pain_angle_id: string;
  scene_description: string;
  scene_setting: string | null;
  scene_mood: string | null;
  scene_duration_seconds: number;
  headline_text: string | null;
  subheadline_text: string | null;
  cta_text: string | null;
  spoken_script: string;
  spoken_duration_seconds: number | null;
  voice_tone: string | null;
  status: 'draft' | 'approved' | 'generated' | 'archived';
  video_url: string | null;
  audio_url: string | null;
}

export interface Product {
  id: string;
  created_at: string;
  name: string;
  tagline: string | null;
  price: number | null;
  guarantee: string | null;
  benefits: string[] | null;
  target_audience: string;
  is_active: boolean;
}

