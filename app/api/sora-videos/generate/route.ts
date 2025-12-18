import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-key',
});

export async function POST(request: NextRequest) {
  try {
    const { prompts } = await request.json();

    if (!prompts || !prompts.visual_hook || !prompts.pain_story || !prompts.cta_closer) {
      return NextResponse.json({ error: 'All 3 Sora prompts are required' }, { status: 400 });
    }

    // Sora 2 Pro configuration
    // - Model: sora-2-pro for highest quality
    // - Duration: 15 seconds per clip
    // - Aspect Ratio: 9:16 (vertical/portrait for social media - 720x1280)
    const SORA_CONFIG = {
      model: 'sora-2-pro',
      seconds: '15' as const,
      size: '720x1280' as const, // 9:16 vertical aspect ratio
    };

    // Start all 3 video generations in parallel
    const [visualHookVideo, painStoryVideo, ctaCloserVideo] = await Promise.all([
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

    // Store all 3 videos in sora_generations table
    const { data: savedGenerations, error: saveError } = await supabase
      .from('sora_generations')
      .insert([
        {
          sora_generation_id: visualHookVideo.id,
          sora_prompt_used: prompts.visual_hook.prompt,
          processing_status: visualHookVideo.status === 'completed' ? 'raw' : 'generating',
        },
        {
          sora_generation_id: painStoryVideo.id,
          sora_prompt_used: prompts.pain_story.prompt,
          processing_status: painStoryVideo.status === 'completed' ? 'raw' : 'generating',
        },
        {
          sora_generation_id: ctaCloserVideo.id,
          sora_prompt_used: prompts.cta_closer.prompt,
          processing_status: ctaCloserVideo.status === 'completed' ? 'raw' : 'generating',
        },
      ])
      .select();

    if (saveError) {
      console.error('Error saving to sora_generations:', saveError);
    }

    return NextResponse.json({
      success: true,
      videos: {
        visual_hook: {
          id: visualHookVideo.id,
          status: visualHookVideo.status,
          progress: visualHookVideo.progress || 0,
          db_id: savedGenerations?.[0]?.id,
        },
        pain_story: {
          id: painStoryVideo.id,
          status: painStoryVideo.status,
          progress: painStoryVideo.progress || 0,
          db_id: savedGenerations?.[1]?.id,
        },
        cta_closer: {
          id: ctaCloserVideo.id,
          status: ctaCloserVideo.status,
          progress: ctaCloserVideo.progress || 0,
          db_id: savedGenerations?.[2]?.id,
        },
      },
    });
  } catch (error) {
    console.error('Error starting Sora video generation:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
