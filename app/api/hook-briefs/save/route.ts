import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { briefs, batch_id, pain_point_id, product_id } = await request.json();

    if (!briefs || !Array.isArray(briefs) || briefs.length === 0) {
      return NextResponse.json({ error: 'No briefs provided' }, { status: 400 });
    }

    // If no batch_id provided, create one
    let finalBatchId = batch_id;
    if (!finalBatchId && pain_point_id && product_id) {
      const { data: newBatch, error: batchError } = await supabase
        .from('hook_brief_batches')
        .insert({
          pain_point_id,
          product_id,
          generation_prompt: 'User-selected briefs'
        })
        .select()
        .single();

      if (batchError) {
        console.error('Failed to create batch:', batchError);
        return NextResponse.json({ error: 'Failed to create batch record' }, { status: 500 });
      }
      finalBatchId = newBatch.id;
    }

    // Save only the selected briefs to the database
    const { data: savedBriefs, error: saveError } = await supabase
      .from('hook_briefs')
      .insert(
        briefs.map((brief: {
          title: string;
          visual_description: string;
          spoken_hook: string;
          text_overlay: string;
          copy_super: string;
          ai_generated_version?: object;
        }) => ({
          batch_id: finalBatchId,
          title: brief.title,
          visual_description: brief.visual_description,
          spoken_hook: brief.spoken_hook,
          text_overlay: brief.text_overlay,
          copy_super: brief.copy_super,
          ai_generated_version: brief.ai_generated_version || brief
        }))
      )
      .select();

    if (saveError) {
      console.error('Failed to save hook briefs:', saveError);
      return NextResponse.json({ error: 'Failed to save briefs to database' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      saved_count: savedBriefs?.length || 0,
      briefs: savedBriefs 
    });
  } catch (error) {
    console.error('Error saving hook briefs:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

