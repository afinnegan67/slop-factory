// Video Editor Types

export interface ManifestAssets {
  manifest_id: string;
  draft_name?: string;
  
  // Video URLs
  visual_hook_url: string | null;
  pain_story_url: string | null;
  cta_closer_url: string | null;
  product_demo_url: string | null;
  
  // Audio URLs
  voiceover_url: string | null;
  background_music_url: string | null;
  
  // Sound effects
  sound_effects: SoundEffect[];
  
  // Settings
  caption_style: string;
  transition_style: string;
}

export interface SoundEffect {
  id: string;
  url: string;
  name?: string;
  timing: number; // seconds into video
  volume: number; // 0-1
}

export interface TextOverlay {
  text: string;
  font?: string;
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
  position: { x: number | 'center'; y: number | 'center' };
  timing: { start: number; end: number };
  animation?: 'none' | 'slam' | 'stamp' | 'fade_in' | 'fade_out';
}

export interface VideoEffect {
  type: 'grayscale' | 'sepia' | 'blur' | 'sharpen' | 'vignette';
  timing: { start: number; end: number };
  intensity?: number;
}

export interface VideoEditingJob {
  id: string;
  manifest_id: string;
  status: 'queued' | 'downloading' | 'processing' | 'encoding' | 'uploading' | 'complete' | 'failed';
  progress: number;
  current_step: string;
  final_video_url: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface DownloadedAssets {
  visual_hook?: string;
  pain_story?: string;
  cta_closer?: string;
  product_demo?: string;
  voiceover?: string;
  background_music?: string;
  sound_effects: Array<{ path: string; timing: number; volume: number; name?: string }>;
}

export interface VideoTemplate {
  totalDuration: number; // seconds
  sections: VideoSection[];
  textOverlays: TextOverlay[];
  audioConfig: AudioConfig;
}

export interface VideoSection {
  name: string;
  startTime: number;
  endTime: number;
  asset: 'visual_hook' | 'pain_story' | 'cta_closer' | 'product_demo';
  effects?: VideoEffect[];
}

export interface AudioConfig {
  voiceoverVolume: number;
  backgroundMusicVolume: number;
  backgroundMusicFadeIn: number; // seconds
  backgroundMusicFadeOut: number; // seconds
}

// The contractor ad template configuration
export const CONTRACTOR_AD_TEMPLATE: VideoTemplate = {
  totalDuration: 70,
  sections: [
    {
      name: 'opening_hook',
      startTime: 0,
      endTime: 7,
      asset: 'visual_hook',
      effects: [{ type: 'grayscale', timing: { start: 3, end: 6 }, intensity: 1 }]
    },
    {
      name: 'pain_story',
      startTime: 7,
      endTime: 28,
      asset: 'pain_story'
    },
    {
      name: 'product_demo',
      startTime: 28,
      endTime: 59,
      asset: 'product_demo'
    },
    {
      name: 'cta_closer',
      startTime: 59,
      endTime: 70,
      asset: 'cta_closer'
    }
  ],
  textOverlays: [
    {
      text: 'RESIDENTIAL CONTRACTORS',
      font: 'Bungee',
      fontSize: 56,
      fontColor: '#000000',
      backgroundColor: '#FFD700',
      position: { x: 'center', y: 80 },
      timing: { start: 0, end: 17 }
    },
    {
      text: '$10,800 PROFIT',
      font: 'Bungee',
      fontSize: 72,
      fontColor: '#00FF00',
      position: { x: 'center', y: 'center' },
      timing: { start: 0, end: 1.5 }
    },
    {
      text: '-$10,000 PROFIT',
      font: 'Bungee',
      fontSize: 72,
      fontColor: '#FF0000',
      position: { x: 'center', y: 'center' },
      timing: { start: 1.5, end: 3 },
      animation: 'slam'
    },
    {
      text: 'SCOPE CREEP',
      font: 'Bungee',
      fontSize: 64,
      fontColor: '#FF0000',
      backgroundColor: '#FFD700',
      position: { x: 'center', y: 'center' },
      timing: { start: 3, end: 6 },
      animation: 'stamp'
    }
  ],
  audioConfig: {
    voiceoverVolume: 1.0,
    backgroundMusicVolume: 0.28,
    backgroundMusicFadeIn: 2,
    backgroundMusicFadeOut: 3
  }
};

