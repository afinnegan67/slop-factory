import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // First, fetch all hook briefs
    const { data: briefs, error: briefsError } = await supabase
      .from('hook_briefs')
      .select('*')
      .order('created_at', { ascending: false });

    if (briefsError) {
      console.error('Failed to fetch hook briefs:', briefsError);
      return NextResponse.json({ error: 'Failed to fetch hook briefs', details: briefsError.message }, { status: 500 });
    }

    if (!briefs || briefs.length === 0) {
      return NextResponse.json({ hook_briefs: [] });
    }

    // Get unique batch IDs
    const batchIds = [...new Set(briefs.map(b => b.batch_id).filter(Boolean))];

    // Fetch batches with their related data
    let batchMap: Record<string, { id: string; pain_point_id: string; product_id: string; pain_point?: Record<string, unknown>; product?: Record<string, unknown> }> = {};
    
    if (batchIds.length > 0) {
      const { data: batches, error: batchError } = await supabase
        .from('hook_brief_batches')
        .select('id, pain_point_id, product_id')
        .in('id', batchIds);

      if (!batchError && batches) {
        // Get pain points and products
        const painPointIds = [...new Set(batches.map(b => b.pain_point_id).filter(Boolean))];
        const productIds = [...new Set(batches.map(b => b.product_id).filter(Boolean))];

        const [painPointsRes, productsRes] = await Promise.all([
          painPointIds.length > 0 
            ? supabase.from('pain_points').select('id, title, emotional_impact_score, description, visceral_trigger').in('id', painPointIds)
            : { data: [], error: null },
          productIds.length > 0
            ? supabase.from('products').select('id, name, price_cents, value_proposition, guarantees').in('id', productIds)
            : { data: [], error: null }
        ]);

        const painPointMap: Record<string, Record<string, unknown>> = {};
        const productMap: Record<string, Record<string, unknown>> = {};

        if (painPointsRes.data) {
          painPointsRes.data.forEach((pp: Record<string, unknown>) => {
            painPointMap[pp.id as string] = pp;
          });
        }

        if (productsRes.data) {
          productsRes.data.forEach((prod: Record<string, unknown>) => {
            productMap[prod.id as string] = prod;
          });
        }

        batches.forEach(batch => {
          batchMap[batch.id] = {
            ...batch,
            pain_point: batch.pain_point_id ? painPointMap[batch.pain_point_id] : undefined,
            product: batch.product_id ? productMap[batch.product_id] : undefined
          };
        });
      }
    }

    // Combine briefs with their batch data
    const enrichedBriefs = briefs.map(brief => ({
      ...brief,
      batch: brief.batch_id ? batchMap[brief.batch_id] : undefined
    }));

    return NextResponse.json({ hook_briefs: enrichedBriefs });
  } catch (error) {
    console.error('Error fetching hook briefs:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
