import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch visual hooks
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const painAngleId = searchParams.get('pain_angle_id');
  const status = searchParams.get('status');

  let query = supabase
    .from('visual_hooks')
    .select(`
      *,
      pain_angle:pain_angles(title, visceral_phrase)
    `)
    .order('created_at', { ascending: false });

  if (painAngleId) {
    query = query.eq('pain_angle_id', painAngleId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ visual_hooks: data });
}

// PATCH - Update a visual hook
export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json();

  if (!id) {
    return NextResponse.json({ error: 'Visual hook ID is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('visual_hooks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ visual_hook: data });
}

