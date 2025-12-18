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


