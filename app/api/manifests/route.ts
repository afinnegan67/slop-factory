import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Load manifest for a batch, or list all manifests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batch_id = searchParams.get('batch_id');
    const manifest_id = searchParams.get('manifest_id');
    const load_recent = searchParams.get('load_recent'); // New: load recent videos regardless of batch

    // If manifest_id provided, get specific manifest
    if (manifest_id) {
      const { data: manifest, error } = await supabase
        .from('video_asset_manifests')
        .select('*')
        .eq('id', manifest_id)
        .single();

      if (error || !manifest) {
        return NextResponse.json({ error: 'Manifest not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, manifest });
    }

    // Load recent assets (regardless of batch_id linkage)
    if (load_recent === 'true') {
      console.log('=== LOADING RECENT ASSETS ===');
      
      // Get recent Sora videos (completed ones, regardless of batch_id)
      const { data: soraVideos, error: soraError } = await supabase
        .from('sora_generations')
        .select('*, sora_prompts(*)')
        .in('processing_status', ['processed', 'raw', 'completed'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (soraError) {
        console.error('Sora videos fetch error:', soraError);
      }
      
      console.log(`Found ${soraVideos?.length || 0} Sora videos`);

      // Get most recent production batch with audio
      let { data: recentBatch } = await supabase
        .from('production_batches')
        .select('*')
        .not('audio_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // If no batch found, try to find audio files directly from storage
      // and create a batch for backwards compatibility
      if (!recentBatch) {
        console.log('No production batch found, checking sora-videos/audio for audio files...');
        
        // Use storage API to list audio files from sora-videos bucket, audio folder
        const { data: audioFiles, error: listError } = await supabase.storage
          .from('sora-videos')
          .list('audio', { limit: 20 });
        
        console.log('Storage list from sora-videos/audio:');
        console.log('  Files found:', audioFiles?.length || 0);
        console.log('  Error:', listError?.message || 'none');
        console.log('  File names:', audioFiles?.map(f => f.name) || []);
        
        if (audioFiles && audioFiles.length > 0) {
          // Filter for audio files (mp3 or files containing 'script_audio')
          const audioOnlyFiles = audioFiles.filter(f => {
            if (!f.name) return false;
            // Skip folders (they have no metadata or have .folder extension)
            if (f.name === '.emptyFolderPlaceholder') return false;
            // Match audio files by extension or name pattern
            return f.name.endsWith('.mp3') || 
                   f.name.includes('script_audio') ||
                   f.name.includes('audio_');
          });
          
          console.log('Filtered audio files:', audioOnlyFiles.map(f => f.name));
          
          if (audioOnlyFiles.length > 0) {
            // Sort by name descending (filename contains timestamp like script_audio_1766115858)
            audioOnlyFiles.sort((a, b) => {
              // Extract timestamp from filename for proper sorting
              const getTimestamp = (name: string) => {
                const match = name.match(/(\d{13})/);
                return match ? parseInt(match[1]) : 0;
              };
              return getTimestamp(b.name) - getTimestamp(a.name);
            });
            
            const mostRecentAudio = audioOnlyFiles[0];
            console.log('Most recent audio file:', mostRecentAudio.name);
            
            // Construct the public URL
            const { data: urlData } = supabase.storage
              .from('sora-videos')
              .getPublicUrl(`audio/${mostRecentAudio.name}`);
            
            console.log('Audio URL:', urlData.publicUrl);
            
            // Create a production batch for this audio
            const { data: newBatch, error: insertError } = await supabase
              .from('production_batches')
              .insert({
                audio_url: urlData.publicUrl,
                current_status: 'audio_complete',
                batch_name: `Voiceover ${new Date().toLocaleDateString()}`
              })
              .select()
              .single();
            
            if (insertError) {
              console.error('Failed to create production batch:', insertError);
            } else if (newBatch) {
              recentBatch = newBatch;
              console.log('Created production batch for existing audio:', newBatch.id);
            }
          } else {
            console.log('No audio files found after filtering');
          }
        } else {
          console.log('No files found in sora-videos/audio folder');
        }
      }

      console.log('Recent batch with audio:', recentBatch?.id, 'audio_url:', recentBatch?.audio_url ? 'YES' : 'NO');

      // Get media library assets directly from storage.objects table
      // Using direct SQL query since storage.list() has permission issues
      console.log('=== LOADING MEDIA LIBRARY FROM STORAGE.OBJECTS ===');
      
      // Get Supabase project URL for constructing public URLs
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      
      // Load background music files from storage.objects
      const { data: bgMusicRows, error: bgMusicError } = await supabase
        .from('storage_objects_view')
        .select('*')
        .eq('bucket_id', 'media-library')
        .like('name', 'background-music/%');
      
      // Fallback: If view doesn't exist, construct URLs manually
      let backgroundMusic: Array<{ id: string; asset_name: string; file_url: string; asset_type: string; tags: string[] }> = [];
      
      if (bgMusicError || !bgMusicRows || bgMusicRows.length === 0) {
        console.log('Using fallback for background music. Error:', bgMusicError?.message || 'no data');
        // Hardcoded known files since we verified they exist
        const knownBgMusic = [
          'Futile - The Grey Room _ Golden Palms.mp3',
          'Ruff Money - The Grey Room _ Clark Sims.mp3'
        ];
        backgroundMusic = knownBgMusic.map(filename => ({
          id: filename,
          asset_name: filename.replace(/\.[^/.]+$/, ''),
          file_url: `${supabaseUrl}/storage/v1/object/public/media-library/background-music/${encodeURIComponent(filename)}`,
          asset_type: 'background_music',
          tags: []
        }));
      } else {
        backgroundMusic = bgMusicRows
          .filter((row: { name: string }) => row.name.endsWith('.mp3') || row.name.endsWith('.wav'))
          .map((row: { id: string; name: string }) => {
            const filename = row.name.replace('background-music/', '');
            return {
              id: row.id || filename,
              asset_name: filename.replace(/\.[^/.]+$/, ''),
              file_url: `${supabaseUrl}/storage/v1/object/public/media-library/${row.name}`,
              asset_type: 'background_music',
              tags: []
            };
          });
      }
      
      console.log('Background music loaded:', backgroundMusic.length, 'tracks');
      
      // Load sound effects files from storage.objects
      const { data: sfxRows, error: sfxError } = await supabase
        .from('storage_objects_view')
        .select('*')
        .eq('bucket_id', 'media-library')
        .like('name', 'sound-effects/%');
      
      let soundEffects: Array<{ id: string; asset_name: string; file_url: string; asset_type: string; tags: string[] }> = [];
      
      if (sfxError || !sfxRows || sfxRows.length === 0) {
        console.log('Using fallback for sound effects. Error:', sfxError?.message || 'no data');
        // Hardcoded known files since we verified they exist
        const knownSfx = [
          'Whoosh.mp3',
          'metal_slam.wav',
          'camera_shutter.wav',
          '554841__lucish__cha_ching.mp3',
          '390715__funwithsound__breaking-glass-8.mp3',
          '522720__mendenhall02__denied-sound.mp3',
          'iphone-ding-sound-effect-made-with-Voicemod.mp3'
        ];
        soundEffects = knownSfx.map(filename => ({
          id: filename,
          asset_name: filename.replace(/\.[^/.]+$/, ''),
          file_url: `${supabaseUrl}/storage/v1/object/public/media-library/sound-effects/${encodeURIComponent(filename)}`,
          asset_type: 'sound_effect',
          tags: []
        }));
      } else {
        soundEffects = sfxRows
          .filter((row: { name: string }) => row.name.endsWith('.mp3') || row.name.endsWith('.wav'))
          .map((row: { id: string; name: string }) => {
            const filename = row.name.replace('sound-effects/', '');
            return {
              id: row.id || filename,
              asset_name: filename.replace(/\.[^/.]+$/, ''),
              file_url: `${supabaseUrl}/storage/v1/object/public/media-library/${row.name}`,
              asset_type: 'sound_effect',
              tags: []
            };
          });
      }
      
      console.log('Sound effects loaded:', soundEffects.length, 'files');

      // Load product demos from storage bucket (like other media assets)
      let productDemos: Array<{ id: string; asset_name: string; demo_video_url: string; asset_type: string }> = [];
      
      // Hardcoded known product demo files since we verified they exist
      const knownProductDemos = [
        'Change Order Prodcut Demo Asset.mp4',
        'Site Reporter Demo Asset.mp4'
      ];
      productDemos = knownProductDemos.map(filename => ({
        id: filename,
        asset_name: filename.replace(/\.[^/.]+$/, ''), // Remove extension for display
        demo_video_url: `${supabaseUrl}/storage/v1/object/public/media-library/product-demo-assets/${encodeURIComponent(filename)}`,
        asset_type: 'product_demo'
      }));
      
      console.log('Product demos loaded:', productDemos.length, 'files');

      // Categorize Sora videos by prompt content
      const categorizedVideos = categorizeSoraVideos(soraVideos || []);

      return NextResponse.json({
        success: true,
        manifest: null,
        batch_id: recentBatch?.id || null,
        available_assets: {
          sora_videos: categorizedVideos,
          all_sora_videos: soraVideos || [],
          background_music: backgroundMusic || [],
          sound_effects: soundEffects || [],
          product_demos: productDemos || [],
          voiceover: {
            batch_id: recentBatch?.id || null,
            audio_url: recentBatch?.audio_url || null
          }
        }
      });
    }

    // If batch_id provided, get manifest for that batch
    if (batch_id) {
      const { data: manifest, error } = await supabase
        .from('video_asset_manifests')
        .select('*')
        .eq('batch_id', batch_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Manifest fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch manifest' }, { status: 500 });
      }

      // Fetch videos - first try by batch_id, then fall back to recent unassigned videos
      let { data: soraVideos } = await supabase
        .from('sora_generations')
        .select('*, sora_prompts(*)')
        .eq('batch_id', batch_id)
        .in('processing_status', ['processed', 'raw', 'completed']);

      // If no videos found with this batch_id, get recent unassigned videos
      if (!soraVideos || soraVideos.length === 0) {
        console.log('No videos with batch_id, fetching recent unassigned videos...');
        const { data: recentVideos } = await supabase
          .from('sora_generations')
          .select('*, sora_prompts(*)')
          .is('batch_id', null)
          .in('processing_status', ['processed', 'raw', 'completed'])
          .order('created_at', { ascending: false })
          .limit(10);
        soraVideos = recentVideos;
      }

      // Fetch other assets
      const [
        { data: backgroundMusic },
        { data: soundEffects },
        { data: productDemos },
        { data: batch }
      ] = await Promise.all([
        supabase
          .from('media_library')
          .select('*')
          .eq('asset_type', 'background_music')
          .eq('is_active', true),
        supabase
          .from('media_library')
          .select('*')
          .eq('asset_type', 'sound_effect')
          .eq('is_active', true),
        supabase
          .from('product_demo_assets')
          .select('*, products(*)')
          .eq('is_active', true),
        supabase
          .from('production_batches')
          .select('*')
          .eq('id', batch_id)
          .single()
      ]);

      // Categorize Sora videos
      const categorizedVideos = categorizeSoraVideos(soraVideos || []);

      return NextResponse.json({
        success: true,
        manifest: manifest || null,
        available_assets: {
          sora_videos: categorizedVideos,
          all_sora_videos: soraVideos || [],
          background_music: backgroundMusic || [],
          sound_effects: soundEffects || [],
          product_demos: productDemos || [],
          voiceover: {
            batch_id: batch?.id,
            audio_url: batch?.audio_url
          }
        }
      });
    }

    // List all manifests
    const { data: manifests, error } = await supabase
      .from('video_asset_manifests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Manifests list error:', error);
      return NextResponse.json({ error: 'Failed to list manifests' }, { status: 500 });
    }

    return NextResponse.json({ success: true, manifests });

  } catch (error) {
    console.error('Manifest GET error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper function to categorize Sora videos by prompt content
function categorizeSoraVideos(videos: Array<{
  id: string;
  sora_prompt_used?: string;
  sora_prompts?: { prompt_type?: string };
  [key: string]: unknown;
}>) {
  return {
    visual_hook: videos.filter(v => {
      const prompt = v.sora_prompt_used?.toLowerCase() || '';
      const type = v.sora_prompts?.prompt_type?.toLowerCase() || '';
      return prompt.includes('hook') || prompt.includes('visual') || 
             type.includes('hook') || prompt.includes('zoom');
    }),
    pain_story: videos.filter(v => {
      const prompt = v.sora_prompt_used?.toLowerCase() || '';
      const type = v.sora_prompts?.prompt_type?.toLowerCase() || '';
      return prompt.includes('pain') || prompt.includes('story') || 
             prompt.includes('late-night') || prompt.includes('frustrat') ||
             type.includes('pain');
    }),
    cta_closer: videos.filter(v => {
      const prompt = v.sora_prompt_used?.toLowerCase() || '';
      const type = v.sora_prompts?.prompt_type?.toLowerCase() || '';
      return prompt.includes('cta') || prompt.includes('closer') || 
             prompt.includes('confident') || prompt.includes('workspace') ||
             type.includes('cta');
    }),
    uncategorized: videos.filter(v => {
      const prompt = v.sora_prompt_used?.toLowerCase() || '';
      const type = v.sora_prompts?.prompt_type?.toLowerCase() || '';
      // If it doesn't match any specific category
      const isHook = prompt.includes('hook') || prompt.includes('visual') || prompt.includes('zoom');
      const isPain = prompt.includes('pain') || prompt.includes('story') || prompt.includes('late-night') || prompt.includes('frustrat');
      const isCta = prompt.includes('cta') || prompt.includes('closer') || prompt.includes('confident') || prompt.includes('workspace');
      return !isHook && !isPain && !isCta && !type.includes('hook') && !type.includes('pain') && !type.includes('cta');
    })
  };
}

// POST - Create or update manifest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      batch_id,
      draft_name,
      visual_hook_video_id,
      pain_story_video_id,
      cta_closer_video_id,
      voiceover_batch_id,
      product_demo_id,
      background_music_id,
      sound_effects,
      caption_style,
      transition_style,
      is_locked,
      resolved_assets // The "treasure map" with all resolved URLs
    } = body;

    if (!batch_id) {
      return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });
    }

    console.log('=== SAVING ASSET MANIFEST ===');
    console.log('Batch ID:', batch_id);
    console.log('Visual Hook:', visual_hook_video_id);
    console.log('Pain Story:', pain_story_video_id);
    console.log('CTA Closer:', cta_closer_video_id);
    console.log('Has resolved_assets:', !!resolved_assets);

    // Helper to validate UUID format (foreign key columns require valid UUIDs or null)
    const isValidUUID = (str: string | null | undefined): boolean => {
      if (!str) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    // Upsert the manifest
    // Note: background_music_id and product_demo_id may be filenames (strings) not UUIDs
    // so we only pass them if they're valid UUIDs, otherwise null (data is in resolved_assets)
    const { data: manifest, error } = await supabase
      .from('video_asset_manifests')
      .upsert({
        batch_id,
        draft_name: draft_name || `Draft ${new Date().toLocaleDateString()}`,
        visual_hook_video_id: isValidUUID(visual_hook_video_id) ? visual_hook_video_id : null,
        pain_story_video_id: isValidUUID(pain_story_video_id) ? pain_story_video_id : null,
        cta_closer_video_id: isValidUUID(cta_closer_video_id) ? cta_closer_video_id : null,
        voiceover_batch_id: isValidUUID(voiceover_batch_id) ? voiceover_batch_id : (isValidUUID(batch_id) ? batch_id : null),
        product_demo_id: isValidUUID(product_demo_id) ? product_demo_id : null, // May be filename, store in resolved_assets
        background_music_id: isValidUUID(background_music_id) ? background_music_id : null, // May be filename, store in resolved_assets
        sound_effects: sound_effects || [],
        caption_style: caption_style || 'bold_yellow',
        transition_style: transition_style || 'hard_cuts',
        is_locked: is_locked || false,
        resolved_assets: resolved_assets || null // Store the full "treasure map" with all URLs for the AI agent
      }, {
        onConflict: 'batch_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Manifest save error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ error: `Failed to save manifest: ${error.message}` }, { status: 500 });
    }

    console.log('=== MANIFEST SAVED ===');
    console.log('Manifest ID:', manifest.id);

    return NextResponse.json({
      success: true,
      manifest
    });

  } catch (error) {
    console.error('Manifest POST error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH - Lock/unlock manifest
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { manifest_id, is_locked } = body;

    if (!manifest_id) {
      return NextResponse.json({ error: 'manifest_id is required' }, { status: 400 });
    }

    const { data: manifest, error } = await supabase
      .from('video_asset_manifests')
      .update({ is_locked })
      .eq('id', manifest_id)
      .select()
      .single();

    if (error) {
      console.error('Manifest lock error:', error);
      return NextResponse.json({ error: 'Failed to update manifest' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      manifest
    });

  } catch (error) {
    console.error('Manifest PATCH error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
