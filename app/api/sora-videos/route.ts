import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: generations, error } = await supabase
      .from('sora_generations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sora generations:', error);
      return NextResponse.json({ error: 'Failed to fetch sora generations' }, { status: 500 });
    }

    return NextResponse.json({ generations: generations || [] });
  } catch (error) {
    console.error('Error fetching sora generations:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
