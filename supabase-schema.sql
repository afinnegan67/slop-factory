-- SLOP FACTORY DATABASE SCHEMA
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. RESEARCH JOBS TABLE
-- Tracks deep research requests
-- ============================================
CREATE TABLE research_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Research parameters
  topic TEXT NOT NULL,
  target_audience TEXT DEFAULT 'residential contractors',
  research_depth TEXT DEFAULT 'comprehensive', -- 'quick', 'standard', 'comprehensive'
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'researching', 'analyzing', 'completed', 'failed'
  
  -- Research output
  raw_research TEXT, -- Full ChatGPT research report
  research_summary TEXT, -- Condensed summary
  
  -- Metadata
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  error_message TEXT
);

-- ============================================
-- 2. PAIN ANGLES TABLE
-- Extracted pain points from research
-- ============================================
CREATE TABLE pain_angles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Link to research
  research_job_id UUID REFERENCES research_jobs(id) ON DELETE CASCADE,
  
  -- Pain angle content
  title TEXT NOT NULL, -- Short title (e.g., "Working for Free")
  description TEXT NOT NULL, -- Full pain description
  visceral_phrase TEXT, -- Punchy version (e.g., "Handshake = $10k loss")
  
  -- Categorization
  category TEXT, -- 'financial', 'time', 'family', 'stress', 'reputation'
  intensity_score INTEGER CHECK (intensity_score >= 1 AND intensity_score <= 10),
  
  -- User interaction
  is_approved BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0
);

-- ============================================
-- 3. VISUAL HOOKS TABLE
-- Generated hooks for each pain angle
-- ============================================
CREATE TABLE visual_hooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Link to pain angle
  pain_angle_id UUID REFERENCES pain_angles(id) ON DELETE CASCADE,
  
  -- Visual scene (for Sora)
  scene_description TEXT NOT NULL, -- Detailed visual description for AI video
  scene_setting TEXT, -- 'job_site', 'home', 'office', 'truck', 'client_meeting'
  scene_mood TEXT, -- 'frustrated', 'defeated', 'angry', 'exhausted', 'hopeful'
  scene_duration_seconds INTEGER DEFAULT 5,
  
  -- On-screen text copy
  headline_text TEXT, -- Big text that appears on screen
  subheadline_text TEXT, -- Supporting text
  cta_text TEXT, -- Call to action text
  
  -- Spoken script (for ElevenLabs)
  spoken_script TEXT NOT NULL, -- What the voiceover says
  spoken_duration_seconds INTEGER,
  voice_tone TEXT, -- 'empathetic', 'urgent', 'conversational', 'authoritative'
  
  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'generated', 'archived'
  
  -- Generated assets (URLs after Sora/ElevenLabs)
  video_url TEXT,
  audio_url TEXT
);

-- ============================================
-- 4. PRODUCTS TABLE
-- Products we're advertising
-- ============================================
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  name TEXT NOT NULL, -- 'Change Order Shield'
  tagline TEXT,
  price DECIMAL(10,2),
  guarantee TEXT, -- 'Lifetime access'
  
  -- Key benefits for script generation
  benefits JSONB, -- Array of benefit strings
  
  -- Target audience
  target_audience TEXT DEFAULT 'residential contractors',
  
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- 5. SCRIPTS TABLE  
-- Full ad scripts combining pain + product
-- ============================================
CREATE TABLE scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Links
  pain_angle_id UUID REFERENCES pain_angles(id),
  product_id UUID REFERENCES products(id),
  visual_hook_id UUID REFERENCES visual_hooks(id),
  
  -- Script content
  full_script TEXT NOT NULL,
  script_length_seconds INTEGER, -- 30, 45, 60
  
  -- Structure breakdown
  hook_section TEXT, -- First 3 seconds
  pain_section TEXT, -- Pain amplification  
  solution_section TEXT, -- Product intro
  proof_section TEXT, -- Social proof/guarantee
  cta_section TEXT, -- Call to action
  
  -- Status
  status TEXT DEFAULT 'draft',
  performance_score DECIMAL(3,2), -- After testing
  
  -- Metadata
  version INTEGER DEFAULT 1
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_research_jobs_status ON research_jobs(status);
CREATE INDEX idx_pain_angles_research ON pain_angles(research_job_id);
CREATE INDEX idx_pain_angles_approved ON pain_angles(is_approved);
CREATE INDEX idx_visual_hooks_pain ON visual_hooks(pain_angle_id);
CREATE INDEX idx_scripts_pain ON scripts(pain_angle_id);

-- ============================================
-- SEED DATA: Default Products
-- ============================================
INSERT INTO products (name, tagline, price, guarantee, benefits, target_audience) VALUES
('Change Order Shield', 'Never work for free again', 2500.00, 'Lifetime access', 
 '["Automatic change order detection", "Client signature capture", "Payment protection", "Legal documentation"]'::jsonb,
 'residential contractors'),
 
('Site Reporter Pro', 'Document everything, protect yourself', 1500.00, 'Lifetime access',
 '["Photo documentation", "Daily logs", "Weather tracking", "Client updates"]'::jsonb,
 'residential contractors'),
 
('Schedule Builder AI', 'Stop the chaos, own your calendar', 2000.00, 'Lifetime access',
 '["AI scheduling", "Crew management", "Client notifications", "Buffer time automation"]'::jsonb,
 'residential contractors');

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE research_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pain_angles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can tighten this later)
CREATE POLICY "Allow all" ON research_jobs FOR ALL USING (true);
CREATE POLICY "Allow all" ON pain_angles FOR ALL USING (true);
CREATE POLICY "Allow all" ON visual_hooks FOR ALL USING (true);
CREATE POLICY "Allow all" ON products FOR ALL USING (true);
CREATE POLICY "Allow all" ON scripts FOR ALL USING (true);

-- ============================================
-- 6. MEDIA LIBRARY TABLE
-- Background music & sound effects catalog
-- ============================================
CREATE TABLE IF NOT EXISTS media_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type VARCHAR(50) NOT NULL, -- 'background_music', 'sound_effect'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    duration_seconds DECIMAL(10,2),
    tags TEXT[], -- Array of tags like 'upbeat', 'dramatic', 'whoosh'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. PRODUCT DEMO ASSETS TABLE
-- Product demo videos linked to products
-- ============================================
CREATE TABLE IF NOT EXISTS product_demo_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    demo_video_url TEXT NOT NULL,
    demo_type VARCHAR(50) DEFAULT 'main', -- 'main', 'feature_highlight', 'testimonial'
    duration_seconds DECIMAL(10,2),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. EDITOR PACKAGES TABLE
-- Complete packages for video editor agent
-- ============================================
CREATE TABLE IF NOT EXISTS editor_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES production_batches(id) ON DELETE CASCADE,
    package_data JSONB NOT NULL, -- Store the entire package structure
    status VARCHAR(50) DEFAULT 'ready', -- 'ready', 'editing', 'complete', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on new tables
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_demo_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE editor_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON media_library FOR ALL USING (true);
CREATE POLICY "Allow all" ON product_demo_assets FOR ALL USING (true);
CREATE POLICY "Allow all" ON editor_packages FOR ALL USING (true);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(asset_type);
CREATE INDEX IF NOT EXISTS idx_product_demo_product ON product_demo_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_editor_packages_batch ON editor_packages(batch_id);

-- ============================================
-- 9. VIDEO ASSET MANIFESTS TABLE
-- The "recipe card" for video editing agent
-- Stores exact asset selections for video generation
-- ============================================
CREATE TABLE IF NOT EXISTS video_asset_manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES production_batches(id) ON DELETE CASCADE,
    
    -- Sora Videos (specific IDs from sora_generations)
    visual_hook_video_id UUID REFERENCES sora_generations(id),
    pain_story_video_id UUID REFERENCES sora_generations(id),
    cta_closer_video_id UUID REFERENCES sora_generations(id),
    
    -- Audio (the production_batch has the audio_url from ElevenLabs)
    voiceover_batch_id UUID REFERENCES production_batches(id),
    
    -- Product Assets
    product_demo_id UUID REFERENCES product_demo_assets(id),
    
    -- Media Library Selections
    background_music_id UUID REFERENCES media_library(id),
    sound_effects JSONB DEFAULT '[]'::jsonb, -- Array of {effect_id, timing, volume}
    
    -- Visual Settings
    caption_style VARCHAR(50) DEFAULT 'bold_yellow',
    transition_style VARCHAR(50) DEFAULT 'hard_cuts',
    
    -- Status
    is_locked BOOLEAN DEFAULT false, -- When true, ready for generation
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent multiple manifests per batch
    UNIQUE(batch_id)
);

-- Enable RLS
ALTER TABLE video_asset_manifests ENABLE ROW LEVEL SECURITY;

-- Allow all policy (can tighten later)
CREATE POLICY "Allow all" ON video_asset_manifests FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_asset_manifests_batch ON video_asset_manifests(batch_id);
CREATE INDEX IF NOT EXISTS idx_video_asset_manifests_locked ON video_asset_manifests(is_locked);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_video_asset_manifests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_video_asset_manifests_updated_at ON video_asset_manifests;
CREATE TRIGGER update_video_asset_manifests_updated_at
    BEFORE UPDATE ON video_asset_manifests
    FOR EACH ROW
    EXECUTE FUNCTION update_video_asset_manifests_updated_at();

-- Example sound_effects JSONB structure:
-- [
--   { "effect_id": "uuid-whoosh-1", "timing": 0, "volume": 0.6 },
--   { "effect_id": "uuid-slam", "timing": 1.5, "volume": 0.8 },
--   { "effect_id": "uuid-camera", "timing": 12, "volume": 0.5 }
-- ]

-- ============================================
-- 10. VIDEO EDITING JOBS TABLE
-- Tracks video generation job progress
-- ============================================
CREATE TABLE IF NOT EXISTS video_editing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifest_id UUID REFERENCES video_asset_manifests(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'downloading', 'processing', 'encoding', 'uploading', 'complete', 'failed'
    progress INTEGER DEFAULT 0, -- 0-100
    current_step VARCHAR(255),
    final_video_url TEXT,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE video_editing_jobs ENABLE ROW LEVEL SECURITY;

-- Allow all policy (can tighten later)
CREATE POLICY "Allow all" ON video_editing_jobs FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_editing_jobs_manifest ON video_editing_jobs(manifest_id);
CREATE INDEX IF NOT EXISTS idx_video_editing_jobs_status ON video_editing_jobs(status);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_video_editing_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_video_editing_jobs_updated_at ON video_editing_jobs;
CREATE TRIGGER update_video_editing_jobs_updated_at
    BEFORE UPDATE ON video_editing_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_video_editing_jobs_updated_at();

