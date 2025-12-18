import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch all pain angles
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const approved = searchParams.get('approved');
  const jobId = searchParams.get('job_id');

  let query = supabase
    .from('pain_angles')
    .select('*')
    .eq('is_archived', false)
    .order('intensity_score', { ascending: false });

  if (approved === 'true') {
    query = query.eq('is_approved', true);
  }

  if (jobId) {
    query = query.eq('research_job_id', jobId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pain_angles: data });
}

// PATCH - Update a pain angle (approve, archive, etc.)
export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Pain angle ID is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('pain_angles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pain_angle: data });
}

