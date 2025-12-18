import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all pain points
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('pain_points')
      .select('*')
      .eq('is_active', true)
      .order('emotional_impact_score', { ascending: false });

    if (error) {
      console.error('Failed to fetch pain points:', error);
      return NextResponse.json({ error: 'Failed to fetch pain points' }, { status: 500 });
    }

    return NextResponse.json({ pain_points: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save new pain points from research
export async function POST(request: NextRequest) {
  try {
    const { pain_points } = await request.json();

    if (!pain_points || !Array.isArray(pain_points)) {
      return NextResponse.json({ error: 'pain_points array is required' }, { status: 400 });
    }

    // Insert pain points
    const { data, error } = await supabase
      .from('pain_points')
      .insert(
        pain_points.map((pp: {
          title: string;
          description: string;
          visceral_trigger: string;
          emotional_impact_score: number;
        }) => ({
          title: pp.title,
          description: pp.description,
          visceral_trigger: pp.visceral_trigger || pp.description,
          emotional_impact_score: pp.emotional_impact_score || 5,
          is_active: true
        }))
      )
      .select();

    if (error) {
      console.error('Failed to insert pain points:', error);
      return NextResponse.json({ error: 'Failed to save pain points' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pain_points: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a pain point
export async function PATCH(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pain_points')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update pain point:', error);
      return NextResponse.json({ error: 'Failed to update pain point' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pain_point: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

