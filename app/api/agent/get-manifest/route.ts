import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/agent/get-manifest
 * 
 * This is the "recipe card" endpoint for the video editing agent.
 * It returns ALL asset URLs resolved and ready to use, so the agent
 * doesn't have to guess or look up anything.
 * 
 * Query params:
 * - manifest_id: UUID of the video_asset_manifest
 * - batch_id: UUID of the production_batch (will find latest manifest)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const manifest_id = searchParams.get('manifest_id');
    const batch_id = searchParams.get('batch_id');

    if (!manifest_id && !batch_id) {
      return NextResponse.json({ 
        error: 'Either manifest_id or batch_id is required' 
      }, { status: 400 });
    }

    console.log('=== AGENT REQUESTING MANIFEST ===');
    console.log('Manifest ID:', manifest_id);
    console.log('Batch ID:', batch_id);

    // Fetch the manifest with all related data
    let manifestQuery = supabase
      .from('video_asset_manifests')
      .select(`
        *,
        visual_hook:sora_generations!visual_hook_video_id(
          id, sora_generation_id, sora_prompt_used, processing_status, 
          raw_url, processed_url, created_at
        ),
        pain_story:sora_generations!pain_story_video_id(
          id, sora_generation_id, sora_prompt_used, processing_status,
          raw_url, processed_url, created_at
        ),
        cta_closer:sora_generations!cta_closer_video_id(
          id, sora_generation_id, sora_prompt_used, processing_status,
          raw_url, processed_url, created_at
        ),
        product_demo:product_demo_assets!product_demo_id(
          id, demo_video_url, demo_duration_seconds, pricing_graphic_url,
          guarantee_badges_url, products(id, name, price_cents, value_proposition, guarantees)
        ),
        background_music:media_library!background_music_id(
          id, asset_name, file_url, duration_seconds, tags
        ),
        voiceover:production_batches!voiceover_batch_id(
          id, audio_url, elevenlabs_text
        )
      `);

    if (manifest_id) {
      manifestQuery = manifestQuery.eq('id', manifest_id);
    } else if (batch_id) {
      manifestQuery = manifestQuery.eq('batch_id', batch_id).eq('is_locked', true);
    }

    const { data: manifest, error: manifestError } = await manifestQuery
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (manifestError || !manifest) {
      console.error('Manifest not found:', manifestError);
      return NextResponse.json({ 
        error: 'No locked manifest found. Please configure and lock assets first.',
        details: manifestError?.message
      }, { status: 404 });
    }

    // Resolve sound effects (stored as JSONB array of IDs with timing/volume)
    let resolvedSoundEffects: Array<{
      effect_id: string;
      timing: number;
      volume: number;
      name: string;
      url: string;
    }> = [];

    if (manifest.sound_effects && Array.isArray(manifest.sound_effects)) {
      const effectIds = manifest.sound_effects.map((sf: { effect_id: string }) => sf.effect_id);
      
      if (effectIds.length > 0) {
        const { data: effects } = await supabase
          .from('media_library')
          .select('id, asset_name, file_url')
          .in('id', effectIds);

        if (effects) {
          resolvedSoundEffects = manifest.sound_effects.map((sf: { effect_id: string; timing: number; volume: number }) => {
            const effect = effects.find((e: { id: string }) => e.id === sf.effect_id);
            return {
              effect_id: sf.effect_id,
              timing: sf.timing,
              volume: sf.volume,
              name: effect?.asset_name || 'Unknown Effect',
              url: effect?.file_url || ''
            };
          });
        }
      }
    }

    // Get the script text for captions
    const { data: batchWithScript } = await supabase
      .from('production_batches')
      .select(`
        *,
        scripts(
          final_visceral_hook, ai_visceral_hook,
          final_pain_elaboration, ai_pain_elaboration,
          final_solution_intro, ai_solution_intro,
          final_product_pitch, ai_product_pitch,
          final_price_reveal, ai_price_reveal,
          final_cta, ai_cta,
          estimated_duration_seconds
        )
      `)
      .eq('id', manifest.batch_id)
      .single();

    const script = batchWithScript?.scripts;

    // Build the complete agent-ready manifest
    const agentManifest = {
      manifest_id: manifest.id,
      batch_id: manifest.batch_id,
      is_locked: manifest.is_locked,
      created_at: manifest.created_at,
      
      // === SORA VIDEO CLIPS (with exact URLs) ===
      sora_videos: {
        visual_hook: {
          id: manifest.visual_hook?.id,
          url: manifest.visual_hook?.processed_url || manifest.visual_hook?.raw_url,
          prompt_used: manifest.visual_hook?.sora_prompt_used,
          timing: { start: 0, end: 17 },
          purpose: 'Visual Hook - attention grabbing opening scene'
        },
        pain_story: {
          id: manifest.pain_story?.id,
          url: manifest.pain_story?.processed_url || manifest.pain_story?.raw_url,
          prompt_used: manifest.pain_story?.sora_prompt_used,
          timing: { start: 17, end: 28 },
          purpose: 'Pain Story - emotional connection and problem illustration'
        },
        cta_closer: {
          id: manifest.cta_closer?.id,
          url: manifest.cta_closer?.processed_url || manifest.cta_closer?.raw_url,
          prompt_used: manifest.cta_closer?.sora_prompt_used,
          timing: { start: 59, end: 64 },
          purpose: 'CTA Closer - final call to action scene'
        }
      },
      
      // === PRODUCT DEMO ===
      product_demo: manifest.product_demo ? {
        id: manifest.product_demo.id,
        url: manifest.product_demo.demo_video_url,
        duration_seconds: manifest.product_demo.demo_duration_seconds,
        pricing_graphic_url: manifest.product_demo.pricing_graphic_url,
        guarantee_badges_url: manifest.product_demo.guarantee_badges_url,
        timing: { start: 28, end: 59 },
        product: manifest.product_demo.products ? {
          name: manifest.product_demo.products.name,
          price: manifest.product_demo.products.price_cents,
          price_display: `$${(manifest.product_demo.products.price_cents / 100).toLocaleString()}`,
          value_proposition: manifest.product_demo.products.value_proposition,
          guarantees: manifest.product_demo.products.guarantees
        } : null
      } : null,
      
      // === AUDIO ===
      audio: {
        voiceover: {
          id: manifest.voiceover?.id,
          url: manifest.voiceover?.audio_url,
          transcript: manifest.voiceover?.elevenlabs_text,
          timing: { start: 0, end: 64 }
        },
        background_music: manifest.background_music ? {
          id: manifest.background_music.id,
          name: manifest.background_music.asset_name,
          url: manifest.background_music.file_url,
          duration_seconds: manifest.background_music.duration_seconds,
          tags: manifest.background_music.tags,
          volume: 0.28 // Standard background music volume
        } : null,
        sound_effects: resolvedSoundEffects
      },
      
      // === VISUAL SETTINGS ===
      visual_settings: {
        caption_style: manifest.caption_style,
        transition_style: manifest.transition_style,
        text_overlays: {
          font: 'BUNGEE',
          opening_callout: 'RESIDENTIAL CONTRACTORS',
          hook_text: script?.final_visceral_hook || script?.ai_visceral_hook || ''
        }
      },
      
      // === SCRIPT TIMELINE (for captions) ===
      script_timeline: script ? {
        visceral_hook: {
          text: script.final_visceral_hook || script.ai_visceral_hook || '',
          start_time: 0,
          end_time: 8,
          video_clip: 'visual_hook'
        },
        pain_elaboration: {
          text: script.final_pain_elaboration || script.ai_pain_elaboration || '',
          start_time: 8,
          end_time: 17,
          video_clip: 'visual_hook'
        },
        solution_intro: {
          text: script.final_solution_intro || script.ai_solution_intro || '',
          start_time: 17,
          end_time: 28,
          video_clip: 'pain_story'
        },
        product_pitch: {
          text: script.final_product_pitch || script.ai_product_pitch || '',
          start_time: 28,
          end_time: 45,
          video_clip: 'product_demo'
        },
        price_reveal: {
          text: script.final_price_reveal || script.ai_price_reveal || '',
          start_time: 45,
          end_time: 59,
          video_clip: 'product_demo'
        },
        cta: {
          text: script.final_cta || script.ai_cta || '',
          start_time: 59,
          end_time: 64,
          video_clip: 'cta_closer'
        }
      } : null,
      
      // === AGENT INSTRUCTIONS ===
      mcp_workflow: {
        step_1: 'download-assets',
        step_1_urls: [
          manifest.visual_hook?.processed_url || manifest.visual_hook?.raw_url,
          manifest.pain_story?.processed_url || manifest.pain_story?.raw_url,
          manifest.cta_closer?.processed_url || manifest.cta_closer?.raw_url,
          manifest.product_demo?.demo_video_url,
          manifest.voiceover?.audio_url,
          manifest.background_music?.file_url
        ].filter(Boolean),
        step_2: 'combine-clips (in order: visual_hook → pain_story → product_demo → cta_closer)',
        step_3: 'add-voiceover (full length, 0-64s)',
        step_4: 'add-background-music (volume: 0.28)',
        step_5: 'add-sound-effects (at specified timings)',
        step_6: 'add-text-overlays (BUNGEE font, bold_yellow style)',
        step_7: 'upload-supabase'
      }
    };

    console.log('=== MANIFEST READY FOR AGENT ===');
    console.log('Videos:', {
      visual_hook: !!agentManifest.sora_videos.visual_hook.url,
      pain_story: !!agentManifest.sora_videos.pain_story.url,
      cta_closer: !!agentManifest.sora_videos.cta_closer.url
    });
    console.log('Audio:', {
      voiceover: !!agentManifest.audio.voiceover.url,
      background_music: !!agentManifest.audio.background_music?.url
    });

    return NextResponse.json({
      success: true,
      manifest: agentManifest,
      
      // Also provide a raw prompt the agent can use
      agent_prompt: generateAgentPrompt(agentManifest)
    });

  } catch (error) {
    console.error('=== AGENT MANIFEST ERROR ===');
    console.error('Error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Generate a clear text prompt for the agent
function generateAgentPrompt(manifest: Record<string, unknown>): string {
  const sora = manifest.sora_videos as {
    visual_hook: { url?: string };
    pain_story: { url?: string };
    cta_closer: { url?: string };
  };
  const audio = manifest.audio as {
    voiceover: { url?: string };
    background_music?: { url?: string; name?: string };
    sound_effects?: Array<{ timing: number; volume: number; url: string }>;
  };
  const product = manifest.product_demo as { url?: string } | null;
  
  return `
Generate a contractor ad video using these EXACT assets:

SORA VIDEO CLIPS:
- Visual Hook (0-17s): ${sora.visual_hook?.url || 'NOT CONFIGURED'}
- Pain Story (17-28s): ${sora.pain_story?.url || 'NOT CONFIGURED'}
- CTA Closer (59-64s): ${sora.cta_closer?.url || 'NOT CONFIGURED'}

PRODUCT DEMO:
- Demo Video (28-59s): ${product?.url || 'NOT CONFIGURED'}

AUDIO:
- Voiceover (full): ${audio.voiceover?.url || 'NOT CONFIGURED'}
- Background Music: ${audio.background_music?.url || 'NOT CONFIGURED'} (${audio.background_music?.name || ''}, volume: 0.28)

SOUND EFFECTS:
${audio.sound_effects?.map(sfx => 
  `- At ${sfx.timing}s: ${sfx.url} (volume: ${sfx.volume})`
).join('\n') || 'None configured'}

Use the MCP tools to:
1. download-assets (with these exact URLs)
2. combine-clips (in this exact order: visual_hook → pain_story → product_demo → cta_closer)
3. add-voiceover
4. add-background-music
5. add-sound-effects (at specified timings)
6. add-text-overlays (BUNGEE font template)
7. upload-supabase

Do NOT deviate from these assets. They have been pre-selected and approved.
  `.trim();
}
