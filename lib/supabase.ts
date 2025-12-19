import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                    process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for the new database schema

export interface PainPoint {
  id: string;
  title: string;
  description: string;
  visceral_trigger: string;
  emotional_impact_score: number | null;
  usage_count: number;
  avg_performance_score: number | null;
  created_at: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  price_cents: number;
  value_proposition: string;
  key_features: Record<string, unknown> | null;
  guarantees: string[] | null;
  demo_broll_url: string | null;
  created_at: string;
  is_active: boolean;
}

export interface HookBriefBatch {
  id: string;
  pain_point_id: string;
  product_id: string;
  generation_prompt: string;
  created_at: string;
}

export interface HookBrief {
  id: string;
  batch_id: string;
  title: string;
  visual_description: string;
  spoken_hook: string;
  text_overlay: string;
  copy_super: string;
  ai_generated_version: Record<string, unknown>;
  created_at: string;
}

export interface SelectedBrief {
  id: string;
  hook_brief_id: string;
  final_title: string | null;
  final_visual_description: string | null;
  final_spoken_hook: string | null;
  final_text_overlay: string | null;
  final_copy_super: string | null;
  was_edited: boolean;
  edit_notes: string | null;
  selected_at: string;
}

export interface Script {
  id: string;
  selected_brief_id: string;
  ai_visceral_hook: string;
  ai_pain_elaboration: string;
  ai_solution_intro: string;
  ai_product_pitch: string;
  ai_price_reveal: string;
  ai_cta: string;
  final_visceral_hook: string;
  final_pain_elaboration: string;
  final_solution_intro: string;
  final_product_pitch: string;
  final_price_reveal: string;
  final_cta: string;
  estimated_duration_seconds: number | null;
  was_edited: boolean;
  generation_prompt: string | null;
  created_at: string;
}

export interface SoraPrompt {
  id: string;
  script_id: string;
  prompt_type: 'main_hook' | 'supporting_broll_1' | 'supporting_broll_2';
  start_time_seconds: number;
  duration_seconds: number;
  script_section: string | null;
  ai_generated_prompt: string;
  final_prompt: string;
  was_edited: boolean;
  purpose_description: string | null;
  created_at: string;
}

export interface ProductionBatch {
  id: string;
  script_id: string;
  batch_name: string | null;
  elevenlabs_text: string;
  audio_generation_id: string | null;
  audio_url: string | null;
  current_status: 'pending' | 'generating_sora' | 'processing_videos' | 'editing' | 'complete';
  status_details: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export interface SoraGeneration {
  id: string;
  batch_id: string;
  sora_prompt_id: string;
  sora_generation_id: string | null;
  sora_prompt_used: string;
  processing_status: 'generating' | 'raw' | 'scrubbed' | 'processed' | 'packing' | 'ham' | 'failed';
  raw_url: string | null;
  scrubbed_url: string | null;
  processed_url: string | null;
  generation_attempts: number;
  last_error: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface FinalVideo {
  id: string;
  batch_id: string;
  sora_videos_used: string[];
  product_demo_url: string | null;
  audio_url: string | null;
  final_video_url: string | null;
  video_duration_seconds: number | null;
  editing_notes: string | null;
  editor_config: Record<string, unknown> | null;
  created_at: string;
}

export interface AITrainingPair {
  id: string;
  pain_point_id: string | null;
  product_id: string | null;
  content_type: 'hook_brief' | 'script_section' | 'sora_prompt';
  section_name: string | null;
  ai_output: string;
  user_correction: string;
  performance_score: number | null;
  roas: number | null;
  ctr: number | null;
  created_at: string;
}

export interface ComboPerformance {
  id: string;
  pain_point_id: string;
  product_id: string;
  total_videos_created: number;
  avg_roas: number | null;
  avg_ctr: number | null;
  best_performing_video_id: string | null;
  updated_at: string;
}

export interface MediaLibraryAsset {
  id: string;
  asset_type: 'background_music' | 'sound_effect';
  name: string;
  description: string | null;
  file_url: string;
  duration_seconds: number | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductDemoAsset {
  id: string;
  product_id: string;
  demo_video_url: string;
  demo_type: 'main' | 'feature_highlight' | 'testimonial';
  duration_seconds: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface EditorPackage {
  id: string;
  batch_id: string;
  package_data: {
    batch_id: string;
    video_assets: {
      visual_hook: string;
      pain_story: string;
      cta_closer: string;
      product_demo: string;
    };
    audio: {
      voiceover: string;
      background_music_options: Array<{ id: string; name: string; url: string; tags: string[] }>;
    };
    sound_effects: Array<{ id: string; name: string; url: string; tags: string[] }>;
    script_timeline: {
      visceral_hook: { text: string; start_time: number; end_time: number; video_clip: string };
      pain_elaboration: { text: string; start_time: number; end_time: number; video_clip: string };
      solution_intro: { text: string; start_time: number; end_time: number; video_clip: string };
      product_pitch: { text: string; start_time: number; end_time: number; video_clip: string };
      price_reveal: { text: string; start_time: number; end_time: number; video_clip: string };
      cta: { text: string; start_time: number; end_time: number; video_clip: string };
    };
    product: {
      name: string;
      price_display: string;
      guarantees: string[];
    };
    overlays: {
      opening_callout: string;
      pricing_graphics: {
        price: string;
        lifetime_access: boolean;
        no_subscription: boolean;
      };
    };
  };
  status: 'ready' | 'editing' | 'complete' | 'failed';
  created_at: string;
  completed_at: string | null;
}

export interface VideoAssetManifest {
  id: string;
  batch_id: string;
  visual_hook_video_id: string | null;
  pain_story_video_id: string | null;
  cta_closer_video_id: string | null;
  voiceover_batch_id: string | null;
  product_demo_id: string | null;
  background_music_id: string | null;
  sound_effects: Array<{ effect_id: string; timing: number; volume: number }>;
  caption_style: string;
  transition_style: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}
