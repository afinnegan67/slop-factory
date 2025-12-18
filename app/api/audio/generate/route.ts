import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { script_text, voice_id } = await request.json();

    console.log('=== ELEVENLABS AUDIO GENERATION ===');
    console.log('Script length:', script_text?.length);

    if (!script_text) {
      return NextResponse.json({ error: 'Script text is required' }, { status: 400 });
    }

    // Check for API key with multiple possible names
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY || process.env.XI_API_KEY;
    
    console.log('Checking for ElevenLabs API key...');
    console.log('ELEVENLABS_API_KEY exists:', !!process.env.ELEVENLABS_API_KEY);
    console.log('ELEVEN_LABS_API_KEY exists:', !!process.env.ELEVEN_LABS_API_KEY);
    console.log('XI_API_KEY exists:', !!process.env.XI_API_KEY);
    
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ 
        error: 'ElevenLabs API key not configured. Add ELEVENLABS_API_KEY to your .env.local file and restart the dev server.' 
      }, { status: 500 });
    }
    
    console.log('API key found, length:', ELEVENLABS_API_KEY.length);

    // Default to a good male voice if not specified
    // You can change this to any ElevenLabs voice ID
    const selectedVoiceId = voice_id || 'pNInz6obpgDQGcFmaJgB'; // Adam - deep male voice

    console.log('Using voice ID:', selectedVoiceId);
    console.log('Calling ElevenLabs API...');

    // Call ElevenLabs Text-to-Speech API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: script_text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return NextResponse.json({ 
        error: `ElevenLabs API error: ${response.status}`,
        details: errorText 
      }, { status: response.status });
    }

    console.log('ElevenLabs response received, processing audio...');

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    console.log(`Audio size: ${buffer.length} bytes`);

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const fileName = `script_audio_${timestamp}.mp3`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sora-videos') // Reusing the same bucket
      .upload(`audio/${fileName}`, buffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ 
        error: `Failed to upload audio: ${uploadError.message}` 
      }, { status: 500 });
    }

    console.log('Audio uploaded to Supabase:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('sora-videos')
      .getPublicUrl(`audio/${fileName}`);

    console.log('=== AUDIO GENERATION COMPLETE ===');
    console.log('Audio URL:', urlData.publicUrl);

    return NextResponse.json({
      success: true,
      audio: {
        url: urlData.publicUrl,
        fileName: fileName,
        size: buffer.length,
      },
    });
  } catch (error) {
    console.error('=== AUDIO GENERATION ERROR ===');
    console.error('Full error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

