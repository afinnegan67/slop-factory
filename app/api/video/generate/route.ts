import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { VideoEditor, createVideoEditingJob } from '@/lib/video-editor';
import { ManifestAssets } from '@/lib/video-editor/types';

export const maxDuration = 300; // 5 minute timeout for video processing

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { manifest_id, callback_url } = body;

    if (!manifest_id) {
      return NextResponse.json(
        { success: false, error: 'manifest_id is required' },
        { status: 400 }
      );
    }

    // Fetch the manifest with resolved assets
    const { data: manifest, error: manifestError } = await supabase
      .from('video_asset_manifests')
      .select('*')
      .eq('id', manifest_id)
      .single();

    if (manifestError || !manifest) {
      return NextResponse.json(
        { success: false, error: 'Manifest not found' },
        { status: 404 }
      );
    }

    if (!manifest.is_locked) {
      return NextResponse.json(
        { success: false, error: 'Manifest must be locked before video generation' },
        { status: 400 }
      );
    }

    // Get resolved assets from manifest
    const resolvedAssets = manifest.resolved_assets;
    if (!resolvedAssets) {
      return NextResponse.json(
        { success: false, error: 'Manifest has no resolved assets. Re-save the manifest.' },
        { status: 400 }
      );
    }

    // Create a new video editing job
    const jobId = await createVideoEditingJob(manifest_id);

    // Build the ManifestAssets object from resolved_assets
    const assetConfig: ManifestAssets = {
      manifest_id: manifest_id,
      draft_name: manifest.draft_name,
      visual_hook_url: resolvedAssets.sora_videos?.visual_hook?.url || null,
      pain_story_url: resolvedAssets.sora_videos?.pain_story?.url || null,
      cta_closer_url: resolvedAssets.sora_videos?.cta_closer?.url || null,
      product_demo_url: resolvedAssets.product_demo?.url || null,
      voiceover_url: resolvedAssets.voiceover?.url || null,
      background_music_url: resolvedAssets.background_music?.url || null,
      sound_effects: (resolvedAssets.sound_effects || []).map((sfx: { id: string; url: string; name?: string; timing: number; volume: number }) => ({
        id: sfx.id,
        url: sfx.url,
        name: sfx.name,
        timing: sfx.timing || 0,
        volume: sfx.volume || 0.5
      })),
      caption_style: resolvedAssets.settings?.caption_style || 'bold_yellow',
      transition_style: resolvedAssets.settings?.transition_style || 'hard_cuts'
    };

    // Start video processing in background (don't await)
    processVideoInBackground(jobId, assetConfig, callback_url);

    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: 'processing',
      message: 'Video generation started. Poll /api/video/status?job_id=' + jobId + ' for progress.'
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Background processing function
async function processVideoInBackground(
  jobId: string,
  assetConfig: ManifestAssets,
  callbackUrl?: string
) {
  try {
    const editor = new VideoEditor(jobId);
    const finalUrl = await editor.processVideo(assetConfig);

    // If callback URL provided, send completion webhook
    if (callbackUrl) {
      try {
        await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            status: 'complete',
            final_video_url: finalUrl,
            manifest_id: assetConfig.manifest_id
          })
        });
      } catch (callbackError) {
        console.error('Callback webhook failed:', callbackError);
      }
    }

  } catch (error) {
    console.error('Background video processing failed:', error);
    
    // Update job as failed
    await supabase
      .from('video_editing_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', jobId);

    // Send failure callback if provided
    if (callbackUrl) {
      try {
        await fetch(callbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            manifest_id: assetConfig.manifest_id
          })
        });
      } catch (callbackError) {
        console.error('Callback webhook failed:', callbackError);
      }
    }
  }
}

// GET endpoint to check if video generation is available
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Video generation API is available',
    endpoints: {
      generate: 'POST /api/video/generate - Start video generation',
      status: 'GET /api/video/status?job_id=xxx - Check job status'
    }
  });
}

