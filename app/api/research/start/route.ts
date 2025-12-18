import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { runDeepResearch, extractPainAngles } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { topic, targetAudience = 'residential contractors', researchDepth = 'comprehensive' } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Create research job
    const { data: job, error: createError } = await supabase
      .from('research_jobs')
      .insert({
        topic,
        target_audience: targetAudience,
        research_depth: researchDepth,
        status: 'researching'
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create research job:', createError);
      return NextResponse.json({ error: 'Failed to create research job' }, { status: 500 });
    }

    const startTime = Date.now();

    // Run deep research
    const rawResearch = await runDeepResearch(topic, targetAudience);

    // Update job with research
    await supabase
      .from('research_jobs')
      .update({
        raw_research: rawResearch,
        status: 'analyzing'
      })
      .eq('id', job.id);

    // Extract pain angles
    const painAngles = await extractPainAngles(rawResearch);

    // Insert pain angles
    if (painAngles.length > 0) {
      const { error: insertError } = await supabase
        .from('pain_angles')
        .insert(
          painAngles.map(angle => ({
            research_job_id: job.id,
            title: angle.title,
            description: angle.description,
            visceral_phrase: angle.visceral_phrase,
            category: angle.category,
            intensity_score: angle.intensity_score
          }))
        );

      if (insertError) {
        console.error('Failed to insert pain angles:', insertError);
      }
    }

    const processingTime = Date.now() - startTime;

    // Update job as completed
    await supabase
      .from('research_jobs')
      .update({
        status: 'completed',
        processing_time_ms: processingTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // Fetch the pain angles we just created
    const { data: createdAngles } = await supabase
      .from('pain_angles')
      .select('*')
      .eq('research_job_id', job.id)
      .order('intensity_score', { ascending: false });

    return NextResponse.json({
      success: true,
      job_id: job.id,
      pain_angles: createdAngles || [],
      processing_time_ms: processingTime
    });

  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json({ error: 'Research failed' }, { status: 500 });
  }
}

