import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

// Extend timeout for video generation (up to 15 minutes)
export const maxDuration = 900;

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
    const { prompt, prompt_type } = await request.json();

    console.log(`=== SINGLE SORA VIDEO GENERATION: ${prompt_type} ===`);
    console.log('Prompt:', prompt);

    if (!prompt || !prompt_type) {
      return NextResponse.json({ error: 'Prompt and prompt_type are required' }, { status: 400 });
    }

    // Sora 2 configuration
    const SORA_CONFIG = {
      model: 'sora-2' as const,
      seconds: '12' as const,
      size: '720x1280' as const,
    };

    console.log('Using SORA_CONFIG:', SORA_CONFIG);

    // Step 1: Start video generation
    console.log('Starting video generation...');
    
    const videoJob = await openai.videos.create({
      model: SORA_CONFIG.model,
      prompt: prompt,
      seconds: SORA_CONFIG.seconds,
      size: SORA_CONFIG.size,
    });

    console.log('Job started:', videoJob.id, 'Status:', videoJob.status);

    // Step 2: Poll until complete
    console.log('Polling for completion...');
    const completedVideo = await pollVideoUntilComplete(videoJob.id);
    console.log('Video completed!');

    // Step 3: Download and store
    console.log('Downloading and storing video...');
    const timestamp = Date.now();
    const videoUrl = await downloadAndStoreVideo(videoJob.id, `${prompt_type}_${timestamp}`);
    console.log('Video stored:', videoUrl);

    // Step 4: Save to database
    const { data: savedGeneration, error: saveError } = await supabase
      .from('sora_generations')
      .insert({
        sora_generation_id: videoJob.id,
        sora_prompt_used: prompt,
        processing_status: 'raw',
        raw_url: videoUrl,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving to sora_generations:', saveError);
    }

    console.log(`=== SINGLE VIDEO GENERATION COMPLETE: ${prompt_type} ===`);

    return NextResponse.json({
      success: true,
      video: {
        id: videoJob.id,
        status: 'completed',
        url: videoUrl,
        prompt_type: prompt_type,
        db_id: savedGeneration?.id,
      },
    });
  } catch (error) {
    console.error('=== SINGLE VIDEO GENERATION ERROR ===');
    console.error('Full error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
