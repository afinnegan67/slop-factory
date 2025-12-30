# Video Editor Setup Guide

This video editing system uses FFmpeg to combine video clips, add audio tracks, and apply text overlays.

## Requirements

### 1. FFmpeg Installation

FFmpeg must be installed and available in the system PATH.

**Windows:**
```bash
# Using chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
# Add to PATH after extracting
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

### 2. Bungee Font

Download the Bungee font for text overlays:

```bash
# Create fonts directory
mkdir -p public/fonts

# Download Bungee font
curl -o public/fonts/Bungee-Regular.ttf "https://fonts.gstatic.com/s/bungee/v14/N0bU2SZBIuF2PU_0AnQ.ttf"
```

Or download manually from [Google Fonts](https://fonts.google.com/specimen/Bungee) and place `Bungee-Regular.ttf` in `public/fonts/`.

### 3. Supabase Storage Bucket

Create a storage bucket named `final-videos` in your Supabase project:

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `final-videos`
3. Set to public (or configure policies as needed)

### 4. Database Migration

Run the video_editing_jobs table migration from `supabase-schema.sql`:

```sql
-- 10. VIDEO EDITING JOBS TABLE
CREATE TABLE IF NOT EXISTS video_editing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifest_id UUID REFERENCES video_asset_manifests(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    current_step VARCHAR(255),
    final_video_url TEXT,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE video_editing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON video_editing_jobs FOR ALL USING (true);
CREATE INDEX IF NOT EXISTS idx_video_editing_jobs_manifest ON video_editing_jobs(manifest_id);
CREATE INDEX IF NOT EXISTS idx_video_editing_jobs_status ON video_editing_jobs(status);
```

## API Endpoints

### Start Video Generation
```
POST /api/video/generate
Body: { "manifest_id": "uuid", "callback_url": "optional-webhook" }
Response: { "success": true, "job_id": "uuid", "status": "processing" }
```

### Check Job Status
```
GET /api/video/status?job_id=uuid
Response: {
  "success": true,
  "job": {
    "id": "uuid",
    "status": "processing|complete|failed",
    "progress": 45,
    "current_step": "Adding audio tracks...",
    "final_video_url": "https://..."
  }
}
```

### Cancel Job
```
DELETE /api/video/status?job_id=uuid
```

## Processing Pipeline

1. **Download Assets** (0-25%) - Download all media from Supabase URLs
2. **Normalize Clips** (25-45%) - Convert all videos to same format (1080x1920, 30fps)
3. **Concatenate** (45-55%) - Combine video clips in sequence
4. **Add Audio** (55-70%) - Mix voiceover, background music, sound effects
5. **Text Overlays** (70-80%) - Add text with animations
6. **Effects** (80-85%) - Apply video effects (grayscale, etc.)
7. **Final Encode** (85-90%) - High-quality output encoding
8. **Upload** (90-100%) - Upload to Supabase Storage

## Troubleshooting

### FFmpeg not found
Ensure FFmpeg is in your system PATH. Test with `ffmpeg -version`.

### Font not rendering
Check that `public/fonts/Bungee-Regular.ttf` exists and is readable.

### Upload fails
Verify the `final-videos` bucket exists in Supabase and has proper permissions.

### Job stuck at 0%
Check server logs for download errors. Asset URLs may be expired or invalid.

