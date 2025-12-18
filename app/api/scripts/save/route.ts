import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { script, hook_brief_id, selected_brief_id } = await request.json();

    if (!script) {
      return NextResponse.json({ error: 'Script data is required' }, { status: 400 });
    }

    // First, create a selected_brief record if we have hook_brief_id
    let finalSelectedBriefId = selected_brief_id;
    
    if (hook_brief_id && !selected_brief_id) {
      const { data: selectedBrief, error: selectedError } = await supabase
        .from('selected_briefs')
        .insert({
          hook_brief_id,
          was_edited: false
        })
        .select()
        .single();

      if (selectedError) {
        console.error('Failed to create selected brief:', selectedError);
        return NextResponse.json({ error: 'Failed to create selected brief record' }, { status: 500 });
      }
      
      finalSelectedBriefId = selectedBrief.id;
    }

    // Save the script
    const { data: savedScript, error: scriptError } = await supabase
      .from('scripts')
      .insert({
        selected_brief_id: finalSelectedBriefId,
        ai_visceral_hook: script.visceral_hook,
        ai_pain_elaboration: script.pain_elaboration,
        ai_solution_intro: script.solution_intro,
        ai_product_pitch: script.product_pitch,
        ai_price_reveal: script.price_reveal,
        ai_cta: script.cta,
        final_visceral_hook: script.visceral_hook,
        final_pain_elaboration: script.pain_elaboration,
        final_solution_intro: script.solution_intro,
        final_product_pitch: script.product_pitch,
        final_price_reveal: script.price_reveal,
        final_cta: script.cta,
        estimated_duration_seconds: script.estimated_duration_seconds || 45,
        was_edited: false,
        generation_prompt: 'Generated from hook brief'
      })
      .select()
      .single();

    if (scriptError) {
      console.error('Failed to save script:', scriptError);
      return NextResponse.json({ error: 'Failed to save script to database' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      script: savedScript 
    });
  } catch (error) {
    console.error('Error saving script:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
