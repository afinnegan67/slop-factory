import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

// Extend timeout for video generation (up to 15 minutes)
export const maxDuration = 900; // 900 seconds = 15 minutes

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-key',
});

// Helper function to poll until video is complete
async function pollVideoUntilComplete(videoId: string, maxAttempts = 120): Promise<OpenAI.Videos.Video> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const video = await openai.videos.retrieve(videoId);
    
    console.log(`Polling ${videoId}: status=${video.status}, progress=${video.progress}%`);
    
    if (video.status === 'completed') {
      return video;
    }
    
    if (video.status === 'failed') {
      throw new Error(`Video generation failed for ${videoId}`);
    }
    
    // Wait 10 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 10000));
    attempts++;
  }
  
  throw new Error(`Timeout waiting for video ${videoId}`);
}

// Helper function to download and upload video to Supabase Storage
async function downloadAndStoreVideo(videoId: string, fileName: string): Promise<string> {
  console.log(`Downloading video ${videoId}...`);
  
  // Download from OpenAI
  const content = await openai.videos.downloadContent(videoId);
  const arrayBuffer = await content.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  console.log(`Downloaded ${buffer.length} bytes, uploading to Supabase...`);
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('sora-videos')
    .upload(`raw/${fileName}.mp4`, buffer, {
      contentType: 'video/mp4',
      upsert: true,
    });
  
  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }
  
  console.log(`Uploaded successfully:`, data);
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('sora-videos')
    .getPublicUrl(`raw/${fileName}.mp4`);
  
  return urlData.publicUrl;
}

export async function POST(request: NextRequest) {
  try {
    const { prompts } = await request.json();

    console.log('=== SORA VIDEO GENERATION REQUEST ===');
    console.log('Received prompts:', JSON.stringify(prompts, null, 2));

    if (!prompts || !prompts.visual_hook || !prompts.pain_story || !prompts.cta_closer) {
      console.error('Missing prompts:', { prompts });
      return NextResponse.json({ error: 'All 3 Sora prompts are required' }, { status: 400 });
    }

    // Sora 2 configuration (faster than Pro)
    const SORA_CONFIG = {
      model: 'sora-2' as const,
      seconds: '12' as const,
      size: '720x1280' as const, // Portrait 9:16 (standard resolution)
    };

    console.log('Using SORA_CONFIG:', SORA_CONFIG);

    // Step 1: Start all 3 video generations in parallel
    console.log('Starting parallel video generation...');
    
    const [visualHookJob, painStoryJob, ctaCloserJob] = await Promise.all([
      openai.videos.create({
        model: SORA_CONFIG.model,
        prompt: prompts.visual_hook.prompt,
        seconds: SORA_CONFIG.seconds,
        size: SORA_CONFIG.size,
      }),
      openai.videos.create({
        model: SORA_CONFIG.model,
        prompt: prompts.pain_story.prompt,
        seconds: SORA_CONFIG.seconds,
        size: SORA_CONFIG.size,
      }),
      openai.videos.create({
        model: SORA_CONFIG.model,
        prompt: prompts.cta_closer.prompt,
        seconds: SORA_CONFIG.seconds,
        size: SORA_CONFIG.size,
      }),
    ]);

    console.log('Jobs started:');
    console.log('  Visual Hook:', visualHookJob.id);
    console.log('  Pain Story:', painStoryJob.id);
    console.log('  CTA Closer:', ctaCloserJob.id);

    // Step 2: Poll all 3 until complete
    console.log('Polling for completion (this may take 5-15 minutes)...');
    
    const [visualHookComplete, painStoryComplete, ctaCloserComplete] = await Promise.all([
      pollVideoUntilComplete(visualHookJob.id),
      pollVideoUntilComplete(painStoryJob.id),
      pollVideoUntilComplete(ctaCloserJob.id),
    ]);

    console.log('All videos completed!');

    // Step 3: Download and store all 3 videos
    console.log('Downloading and storing videos to Supabase...');
    
    const timestamp = Date.now();
    const [visualHookUrl, painStoryUrl, ctaCloserUrl] = await Promise.all([
      downloadAndStoreVideo(visualHookJob.id, `visual_hook_${timestamp}`),
      downloadAndStoreVideo(painStoryJob.id, `pain_story_${timestamp}`),
      downloadAndStoreVideo(ctaCloserJob.id, `cta_closer_${timestamp}`),
    ]);

    console.log('Videos stored:');
    console.log('  Visual Hook:', visualHookUrl);
    console.log('  Pain Story:', painStoryUrl);
    console.log('  CTA Closer:', ctaCloserUrl);

    // Step 4: Save to database with actual URLs
    const { data: savedGenerations, error: saveError } = await supabase
      .from('sora_generations')
      .insert([
        {
          sora_generation_id: visualHookJob.id,
          sora_prompt_used: prompts.visual_hook.prompt,
          processing_status: 'raw',
          raw_url: visualHookUrl,
          completed_at: new Date().toISOString(),
        },
        {
          sora_generation_id: painStoryJob.id,
          sora_prompt_used: prompts.pain_story.prompt,
          processing_status: 'raw',
          raw_url: painStoryUrl,
          completed_at: new Date().toISOString(),
        },
        {
          sora_generation_id: ctaCloserJob.id,
          sora_prompt_used: prompts.cta_closer.prompt,
          processing_status: 'raw',
          raw_url: ctaCloserUrl,
          completed_at: new Date().toISOString(),
        },
      ])
      .select();

    if (saveError) {
      console.error('Error saving to sora_generations:', saveError);
    }

    console.log('=== SORA VIDEO GENERATION COMPLETE ===');

    return NextResponse.json({
      success: true,
      videos: {
        visual_hook: {
          id: visualHookJob.id,
          status: 'completed',
          url: visualHookUrl,
          db_id: savedGenerations?.[0]?.id,
        },
        pain_story: {
          id: painStoryJob.id,
          status: 'completed',
          url: painStoryUrl,
          db_id: savedGenerations?.[1]?.id,
        },
        cta_closer: {
          id: ctaCloserJob.id,
          status: 'completed',
          url: ctaCloserUrl,
          db_id: savedGenerations?.[2]?.id,
        },
      },
    });
  } catch (error) {
    console.error('=== SORA VIDEO GENERATION ERROR ===');
    console.error('Full error:', error);
    
    let message = 'Unknown error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      message = error.message;
      console.error('Error message:', message);
      console.error('Error stack:', error.stack);
      
      if ('status' in error) {
        statusCode = (error as { status: number }).status || 500;
      }
    }
    
    return NextResponse.json({ 
      error: message,
      details: error instanceof Error ? error.stack : String(error)
    }, { status: statusCode });
  }
}
