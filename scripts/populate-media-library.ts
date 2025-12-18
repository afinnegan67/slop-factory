import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function populateMediaLibrary() {
  // List all files in storage
  const { data: musicFiles } = await supabase.storage
    .from('media-library')
    .list('background-music');
  
  const { data: sfxFiles } = await supabase.storage
    .from('media-library')
    .list('sound-effects');
  
  // Add background music to database
  for (const file of musicFiles || []) {
    const { data: urlData } = supabase.storage
      .from('media-library')
      .getPublicUrl(`background-music/${file.name}`);
    
    await supabase.from('media_library').insert({
      asset_name: file.name.replace(/\.(mp3|wav)$/, ''),
      asset_type: 'background_music',
      file_url: urlData.publicUrl,
      tags: ['music', 'background'],
    });
    
    console.log(`✅ Added music: ${file.name}`);
  }
  
  // Add sound effects to database
  for (const file of sfxFiles || []) {
    const { data: urlData } = supabase.storage
      .from('media-library')
      .getPublicUrl(`sound-effects/${file.name}`);
    
    // Auto-tag based on filename
    const tags = autoTagSFX(file.name);
    
    await supabase.from('media_library').insert({
      asset_name: file.name.replace(/\.(mp3|wav)$/, ''),
      asset_type: 'sound_effect',
      file_url: urlData.publicUrl,
      tags: tags,
    });
    
    console.log(`✅ Added SFX: ${file.name}`);
  }
  
  console.log('🎉 Media library populated!');
}

function autoTagSFX(fileName: string): string[] {
  const tags = ['effect'];
  const lower = fileName.toLowerCase();
  
  if (lower.includes('whoosh')) tags.push('whoosh', 'transition');
  if (lower.includes('camera') || lower.includes('shutter')) tags.push('camera', 'photo');
  if (lower.includes('ding') || lower.includes('notification')) tags.push('notification', 'alert');
  if (lower.includes('slam') || lower.includes('metal')) tags.push('impact', 'emphasis');
  if (lower.includes('cha') || lower.includes('chin') || lower.includes('cash')) tags.push('money', 'success');
  
  return tags;
}

populateMediaLibrary();