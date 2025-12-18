import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-key',
});

export async function POST(request: NextRequest) {
  try {
    const { video_ids } = await request.json();

    if (!video_ids || !video_ids.visual_hook || !video_ids.pain_story || !video_ids.cta_closer) {
      return NextResponse.json({ error: 'All 3 video IDs are required' }, { status: 400 });
    }

    // Check status of all 3 videos in parallel
    const [visualHookStatus, painStoryStatus, ctaCloserStatus] = await Promise.all([
      openai.videos.retrieve(video_ids.visual_hook),
      openai.videos.retrieve(video_ids.pain_story),
      openai.videos.retrieve(video_ids.cta_closer),
    ]);

    // Update database status for completed/failed videos
    const updatePromises = [];

    if (visualHookStatus.status === 'completed' || visualHookStatus.status === 'failed') {
      updatePromises.push(
        supabase
          .from('sora_generations')
          .update({
            processing_status: visualHookStatus.status === 'completed' ? 'raw' : 'failed',
            completed_at: visualHookStatus.status === 'completed' ? new Date().toISOString() : null,
            last_error: visualHookStatus.status === 'failed' ? 'Generation failed' : null,
          })
          .eq('sora_generation_id', video_ids.visual_hook)
      );
    }

    if (painStoryStatus.status === 'completed' || painStoryStatus.status === 'failed') {
      updatePromises.push(
        supabase
          .from('sora_generations')
          .update({
            processing_status: painStoryStatus.status === 'completed' ? 'raw' : 'failed',
            completed_at: painStoryStatus.status === 'completed' ? new Date().toISOString() : null,
            last_error: painStoryStatus.status === 'failed' ? 'Generation failed' : null,
          })
          .eq('sora_generation_id', video_ids.pain_story)
      );
    }

    if (ctaCloserStatus.status === 'completed' || ctaCloserStatus.status === 'failed') {
      updatePromises.push(
        supabase
          .from('sora_generations')
          .update({
            processing_status: ctaCloserStatus.status === 'completed' ? 'raw' : 'failed',
            completed_at: ctaCloserStatus.status === 'completed' ? new Date().toISOString() : null,
            last_error: ctaCloserStatus.status === 'failed' ? 'Generation failed' : null,
          })
          .eq('sora_generation_id', video_ids.cta_closer)
      );
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    return NextResponse.json({
      videos: {
        visual_hook: {
          id: visualHookStatus.id,
          status: visualHookStatus.status,
          progress: visualHookStatus.progress || 0,
        },
        pain_story: {
          id: painStoryStatus.id,
          status: painStoryStatus.status,
          progress: painStoryStatus.progress || 0,
        },
        cta_closer: {
          id: ctaCloserStatus.id,
          status: ctaCloserStatus.status,
          progress: ctaCloserStatus.progress || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error checking Sora video status:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
