import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateVisualHook } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { pain_angle_id } = await request.json();

    if (!pain_angle_id) {
      return NextResponse.json({ error: 'Pain angle ID is required' }, { status: 400 });
    }

    // Fetch the pain angle
    const { data: painAngle, error: fetchError } = await supabase
      .from('pain_angles')
      .select('*')
      .eq('id', pain_angle_id)
      .single();

    if (fetchError || !painAngle) {
      return NextResponse.json({ error: 'Pain angle not found' }, { status: 404 });
    }

    // Generate visual hook
    const hook = await generateVisualHook({
      title: painAngle.title,
      description: painAngle.description,
      visceral_phrase: painAngle.visceral_phrase || painAngle.title
    });

    // Save to database
    const { data: savedHook, error: insertError } = await supabase
      .from('visual_hooks')
      .insert({
        pain_angle_id,
        scene_description: hook.scene_description,
        scene_setting: hook.scene_setting,
        scene_mood: hook.scene_mood,
        headline_text: hook.headline_text,
        subheadline_text: hook.subheadline_text,
        cta_text: hook.cta_text,
        spoken_script: hook.spoken_script,
        voice_tone: hook.voice_tone,
        status: 'draft'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save visual hook:', insertError);
      return NextResponse.json({ error: 'Failed to save visual hook' }, { status: 500 });
    }

    // Update pain angle usage count
    await supabase
      .from('pain_angles')
      .update({ times_used: (painAngle.times_used || 0) + 1 })
      .eq('id', pain_angle_id);

    return NextResponse.json({
      success: true,
      visual_hook: savedHook
    });

  } catch (error) {
    console.error('Hook generation error:', error);
    return NextResponse.json({ error: 'Hook generation failed' }, { status: 500 });
  }
}

