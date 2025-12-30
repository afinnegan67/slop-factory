import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { batch_id } = await request.json();

    if (!batch_id) {
      return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });
    }

    console.log('=== PREPARING EDITOR PACKAGE ===');
    console.log('Batch ID:', batch_id);

    // 1. Get production batch info
    const { data: batch, error: batchError } = await supabase
      .from('production_batches')
      .select('*, scripts(*)')
      .eq('id', batch_id)
      .single();

    if (batchError || !batch) {
      console.error('Batch fetch error:', batchError);
      return NextResponse.json({ error: 'Production batch not found' }, { status: 404 });
    }

    // 2. Get Sora videos for this batch (need 3 processed videos)
    const { data: soraVideos, error: soraError } = await supabase
      .from('sora_generations')
      .select('*')
      .eq('batch_id', batch_id)
      .in('processing_status', ['processed', 'raw', 'completed']);

    if (soraError) {
      console.error('Sora videos fetch error:', soraError);
      return NextResponse.json({ error: 'Failed to fetch Sora videos' }, { status: 500 });
    }

    // Map Sora videos by their prompt type/purpose
    const videoAssets = {
      visual_hook: soraVideos?.find(v => v.sora_prompt_used?.toLowerCase().includes('hook'))?.raw_url || 
                   soraVideos?.find(v => v.sora_prompt_used?.toLowerCase().includes('hook'))?.processed_url || '',
      pain_story: soraVideos?.find(v => v.sora_prompt_used?.toLowerCase().includes('pain') || v.sora_prompt_used?.toLowerCase().includes('story'))?.raw_url ||
                  soraVideos?.find(v => v.sora_prompt_used?.toLowerCase().includes('pain') || v.sora_prompt_used?.toLowerCase().includes('story'))?.processed_url || '',
      cta_closer: soraVideos?.find(v => v.sora_prompt_used?.toLowerCase().includes('cta') || v.sora_prompt_used?.toLowerCase().includes('closer'))?.raw_url ||
                  soraVideos?.find(v => v.sora_prompt_used?.toLowerCase().includes('cta') || v.sora_prompt_used?.toLowerCase().includes('closer'))?.processed_url || '',
      product_demo: ''
    };

    // If we can't categorize them, just assign in order
    if (!videoAssets.visual_hook && !videoAssets.pain_story && !videoAssets.cta_closer && soraVideos && soraVideos.length >= 3) {
      videoAssets.visual_hook = soraVideos[0]?.raw_url || soraVideos[0]?.processed_url || '';
      videoAssets.pain_story = soraVideos[1]?.raw_url || soraVideos[1]?.processed_url || '';
      videoAssets.cta_closer = soraVideos[2]?.raw_url || soraVideos[2]?.processed_url || '';
    }

    // 3. Get product demo if we have a product_id
    let productDemo = null;
    let product = null;
    
    // Try to get product from script -> selected_brief -> hook_brief -> batch -> product
    if (batch.scripts?.selected_brief_id) {
      const { data: selectedBrief } = await supabase
        .from('selected_briefs')
        .select('*, hook_briefs(*, hook_brief_batches(*, products(*)))')
        .eq('id', batch.scripts.selected_brief_id)
        .single();
      
      if (selectedBrief?.hook_briefs?.hook_brief_batches?.products) {
        product = selectedBrief.hook_briefs.hook_brief_batches.products;
      }
    }

    // Fallback: try to get product from script directly
    if (!product && batch.scripts?.product_id) {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', batch.scripts.product_id)
        .single();
      product = productData;
    }

    // Get product demo
    if (product?.id) {
      const { data: demoData } = await supabase
        .from('product_demo_assets')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_active', true)
        .single();
      
      if (demoData) {
        productDemo = demoData;
        videoAssets.product_demo = demoData.demo_video_url;
      }
    }

    // 4. Get background music
    const { data: backgroundMusic } = await supabase
      .from('media_library')
      .select('*')
      .eq('asset_type', 'background_music')
      .eq('is_active', true);

    // 5. Get sound effects
    const { data: soundEffects } = await supabase
      .from('media_library')
      .select('*')
      .eq('asset_type', 'sound_effect')
      .eq('is_active', true);

    // 6. Build script timeline from the script
    const script = batch.scripts;
    const scriptTimeline = {
      visceral_hook: {
        text: script?.final_visceral_hook || script?.ai_visceral_hook || '',
        start_time: 0,
        end_time: 8,
        video_clip: 'visual_hook'
      },
      pain_elaboration: {
        text: script?.final_pain_elaboration || script?.ai_pain_elaboration || '',
        start_time: 8,
        end_time: 18,
        video_clip: 'pain_story'
      },
      solution_intro: {
        text: script?.final_solution_intro || script?.ai_solution_intro || '',
        start_time: 18,
        end_time: 25,
        video_clip: 'pain_story'
      },
      product_pitch: {
        text: script?.final_product_pitch || script?.ai_product_pitch || '',
        start_time: 25,
        end_time: 40,
        video_clip: 'product_demo'
      },
      price_reveal: {
        text: script?.final_price_reveal || script?.ai_price_reveal || '',
        start_time: 40,
        end_time: 52,
        video_clip: 'cta_closer'
      },
      cta: {
        text: script?.final_cta || script?.ai_cta || '',
        start_time: 52,
        end_time: 60,
        video_clip: 'cta_closer'
      }
    };

    // 7. Build the complete package
    const packageData = {
      batch_id,
      video_assets: videoAssets,
      audio: {
        voiceover: batch.audio_url || '',
        background_music_options: (backgroundMusic || []).map(m => ({
          id: m.id,
          name: m.name,
          url: m.file_url,
          tags: m.tags || []
        }))
      },
      sound_effects: (soundEffects || []).map(s => ({
        id: s.id,
        name: s.name,
        url: s.file_url,
        tags: s.tags || []
      })),
      script_timeline: scriptTimeline,
      product: {
        name: product?.name || 'Unknown Product',
        price_display: product?.price ? `$${(product.price / 100).toLocaleString()}` : '$2,500',
        guarantees: product?.guarantees || ['Lifetime access']
      },
      overlays: {
        opening_callout: 'RESIDENTIAL CONTRACTORS',
        pricing_graphics: {
          price: product?.price ? `$${(product.price / 100).toLocaleString()}` : '$2,500',
          lifetime_access: true,
          no_subscription: true
        }
      }
    };

    // 8. Save to editor_packages table
    const { data: savedPackage, error: saveError } = await supabase
      .from('editor_packages')
      .insert({
        batch_id,
        package_data: packageData,
        status: 'ready'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save editor package:', saveError);
      // Continue anyway, package data is still usable
    }

    // 9. Update production batch status
    await supabase
      .from('production_batches')
      .update({ current_status: 'ready_for_editing' })
      .eq('id', batch_id);

    console.log('=== EDITOR PACKAGE READY ===');
    console.log('Package ID:', savedPackage?.id);

    return NextResponse.json({
      success: true,
      package_id: savedPackage?.id,
      package: packageData
    });

  } catch (error) {
    console.error('=== EDITOR PACKAGE ERROR ===');
    console.error('Error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint to check asset readiness
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batch_id = searchParams.get('batch_id');

    if (!batch_id) {
      return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });
    }

    // Check all assets
    const [
      { data: batch },
      { data: soraVideos },
      { data: backgroundMusic },
      { data: soundEffects }
    ] = await Promise.all([
      supabase.from('production_batches').select('*, scripts(*)').eq('id', batch_id).single(),
      supabase.from('sora_generations').select('*').eq('batch_id', batch_id),
      supabase.from('media_library').select('*').eq('asset_type', 'background_music').eq('is_active', true),
      supabase.from('media_library').select('*').eq('asset_type', 'sound_effect').eq('is_active', true)
    ]);

    // Get product demo
    let productDemo = null;
    let product = null;
    
    if (batch?.scripts?.product_id) {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', batch.scripts.product_id)
        .single();
      product = productData;

      if (product?.id) {
        const { data: demoData } = await supabase
          .from('product_demo_assets')
          .select('*')
          .eq('product_id', product.id)
          .eq('is_active', true)
          .single();
        productDemo = demoData;
      }
    }

    // Count ready videos (processed or raw status)
    const readyVideos = soraVideos?.filter(v => 
      v.processing_status === 'processed' || 
      v.processing_status === 'raw' || 
      v.processing_status === 'completed'
    ) || [];

    const checklist = {
      sora_videos: {
        ready: readyVideos.length >= 3,
        count: readyVideos.length,
        required: 3,
        videos: readyVideos.map(v => ({
          id: v.id,
          sora_generation_id: v.sora_generation_id,
          status: v.processing_status,
          url: v.raw_url || v.processed_url,
          prompt_preview: v.sora_prompt_used?.substring(0, 100) + '...'
        }))
      },
      voiceover: {
        ready: !!batch?.audio_url,
        url: batch?.audio_url
      },
      product_demo: {
        ready: !!productDemo?.demo_video_url,
        product_name: product?.name,
        url: productDemo?.demo_video_url
      },
      background_music: {
        ready: (backgroundMusic?.length || 0) > 0,
        count: backgroundMusic?.length || 0,
        tracks: backgroundMusic?.map(m => ({ id: m.id, name: m.name, url: m.file_url })) || []
      },
      sound_effects: {
        ready: (soundEffects?.length || 0) > 0,
        count: soundEffects?.length || 0,
        effects: soundEffects?.map(s => ({ id: s.id, name: s.name, url: s.file_url })) || []
      }
    };

    const allReady = 
      checklist.sora_videos.ready &&
      checklist.voiceover.ready &&
      checklist.background_music.ready &&
      checklist.sound_effects.ready;
    // Note: product_demo is optional for now

    return NextResponse.json({
      success: true,
      all_ready: allReady,
      checklist
    });

  } catch (error) {
    console.error('Asset check error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



