import { spawn, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { supabase } from '../supabase';
import {
  ManifestAssets,
  DownloadedAssets,
  VideoEditingJob,
  TextOverlay,
  CONTRACTOR_AD_TEMPLATE
} from './types';

// Get FFmpeg path - scan node_modules directly to avoid bundling issues
function getFFmpegPath(): string {
  const cwd = process.cwd();
  
  // All possible locations for ffmpeg binary
  const possiblePaths = [
    // @ffmpeg-installer paths (pnpm structure)
    path.join(cwd, 'node_modules', '.pnpm', '@ffmpeg-installer+ffmpeg@1.1.0', 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
    path.join(cwd, 'node_modules', '.pnpm', '@ffmpeg-installer+ffmpeg@1.1.0', 'node_modules', '@ffmpeg-installer', 'linux-x64', 'ffmpeg'),
    path.join(cwd, 'node_modules', '.pnpm', '@ffmpeg-installer+ffmpeg@1.1.0', 'node_modules', '@ffmpeg-installer', 'darwin-x64', 'ffmpeg'),
    // @ffmpeg-installer paths (npm/yarn structure)
    path.join(cwd, 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
    path.join(cwd, 'node_modules', '@ffmpeg-installer', 'linux-x64', 'ffmpeg'),
    path.join(cwd, 'node_modules', '@ffmpeg-installer', 'darwin-x64', 'ffmpeg'),
    // ffmpeg-static paths
    path.join(cwd, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    path.join(cwd, 'node_modules', 'ffmpeg-static', 'ffmpeg'),
  ];

  for (const ffPath of possiblePaths) {
    if (fs.existsSync(ffPath)) {
      console.log('Found FFmpeg at:', ffPath);
      return ffPath;
    }
  }

  // Last resort: system ffmpeg
  console.warn('FFmpeg not found in node_modules, falling back to system ffmpeg. Searched:', possiblePaths[0]);
  return 'ffmpeg';
}

// Initialize ffmpeg path once
let ffmpegPath: string | null = null;
function getFfmpeg(): string {
  if (!ffmpegPath) {
    ffmpegPath = getFFmpegPath();
  }
  return ffmpegPath;
}

export class VideoEditor {
  private jobId: string;
  private workDir: string;
  private fontPath: string;
  private localFfmpegPath: string | null = null;

  constructor(jobId: string) {
    this.jobId = jobId;
    this.workDir = path.join(os.tmpdir(), 'slop-factory', jobId);
    this.fontPath = path.join(process.cwd(), 'public', 'fonts', 'Bungee-Regular.ttf');
  }

  // Initialize working directory and copy FFmpeg if needed
  async init(): Promise<void> {
    if (!fs.existsSync(this.workDir)) {
      fs.mkdirSync(this.workDir, { recursive: true });
    }
    
    // On Windows, if FFmpeg path has spaces, copy it to work dir
    const ffmpegSrc = getFfmpeg();
    if (process.platform === 'win32' && ffmpegSrc.includes(' ')) {
      const ffmpegDest = path.join(this.workDir, 'ffmpeg.exe');
      if (!fs.existsSync(ffmpegDest)) {
        console.log('Copying FFmpeg to work directory to avoid path issues...');
        fs.copyFileSync(ffmpegSrc, ffmpegDest);
      }
      this.localFfmpegPath = ffmpegDest;
      console.log('Using local FFmpeg:', this.localFfmpegPath);
    }
  }

  // Clean up temp files
  async cleanup(): Promise<void> {
    try {
      if (fs.existsSync(this.workDir)) {
        fs.rmSync(this.workDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }

  // Update job progress in database
  async updateProgress(step: string, progress: number, status?: VideoEditingJob['status']): Promise<void> {
    const updateData: Record<string, unknown> = {
      current_step: step,
      progress,
      updated_at: new Date().toISOString()
    };
    
    if (status) {
      updateData.status = status;
    }

    await supabase
      .from('video_editing_jobs')
      .update(updateData)
      .eq('id', this.jobId);
  }

  // Download a single file from URL
  private async downloadFile(url: string, filename: string, retries = 3): Promise<string> {
    const outputPath = path.join(this.workDir, filename);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const buffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(outputPath, buffer);
        
        // Verify file was written
        if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
          throw new Error('File download resulted in empty file');
        }
        
        return outputPath;
      } catch (error) {
        console.error(`Download attempt ${attempt}/${retries} failed for ${filename}:`, error);
        if (attempt === retries) {
          throw new Error(`Failed to download ${filename} after ${retries} attempts: ${error}`);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error(`Failed to download ${filename}`);
  }

  // Download all assets from manifest
  async downloadAssets(manifest: ManifestAssets): Promise<DownloadedAssets> {
    await this.updateProgress('Downloading assets...', 5, 'downloading');
    
    const assets: DownloadedAssets = {
      sound_effects: []
    };

    const downloads: Promise<void>[] = [];
    let completedDownloads = 0;
    const totalDownloads = [
      manifest.visual_hook_url,
      manifest.pain_story_url,
      manifest.cta_closer_url,
      manifest.product_demo_url,
      manifest.voiceover_url,
      manifest.background_music_url,
      ...manifest.sound_effects.map(s => s.url)
    ].filter(Boolean).length;

    const updateDownloadProgress = () => {
      completedDownloads++;
      const progress = 5 + Math.floor((completedDownloads / totalDownloads) * 20);
      this.updateProgress(`Downloading assets (${completedDownloads}/${totalDownloads})...`, progress);
    };

    // Download video assets
    if (manifest.visual_hook_url) {
      downloads.push(
        this.downloadFile(manifest.visual_hook_url, 'visual_hook.mp4')
          .then(p => { assets.visual_hook = p; updateDownloadProgress(); })
      );
    }
    
    if (manifest.pain_story_url) {
      downloads.push(
        this.downloadFile(manifest.pain_story_url, 'pain_story.mp4')
          .then(p => { assets.pain_story = p; updateDownloadProgress(); })
      );
    }
    
    if (manifest.cta_closer_url) {
      downloads.push(
        this.downloadFile(manifest.cta_closer_url, 'cta_closer.mp4')
          .then(p => { assets.cta_closer = p; updateDownloadProgress(); })
      );
    }
    
    if (manifest.product_demo_url) {
      downloads.push(
        this.downloadFile(manifest.product_demo_url, 'product_demo.mp4')
          .then(p => { assets.product_demo = p; updateDownloadProgress(); })
      );
    }

    // Download audio assets
    if (manifest.voiceover_url) {
      downloads.push(
        this.downloadFile(manifest.voiceover_url, 'voiceover.mp3')
          .then(p => { assets.voiceover = p; updateDownloadProgress(); })
      );
    }
    
    if (manifest.background_music_url) {
      downloads.push(
        this.downloadFile(manifest.background_music_url, 'music.mp3')
          .then(p => { assets.background_music = p; updateDownloadProgress(); })
      );
    }

    // Download sound effects
    for (let i = 0; i < manifest.sound_effects.length; i++) {
      const sfx = manifest.sound_effects[i];
      if (sfx.url) {
        downloads.push(
          this.downloadFile(sfx.url, `sfx_${i}.mp3`)
            .then(p => {
              assets.sound_effects.push({
                path: p,
                timing: sfx.timing,
                volume: sfx.volume,
                name: sfx.name
              });
              updateDownloadProgress();
            })
        );
      }
    }

    await Promise.all(downloads);
    return assets;
  }

  // Run FFmpeg command
  private runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use local copy if available (Windows with spaces in path), otherwise use global
      const ffmpeg_bin = this.localFfmpegPath || getFfmpeg();
      const isWindows = process.platform === 'win32';
      
      if (isWindows) {
        // On Windows, quote paths and filter arguments properly
        const quotedArgs = args.map((arg, index) => {
          // Quote file paths
          const isFilePath = /^[A-Za-z]:[\\/]/.test(arg) || arg.includes('\\');
          // Quote args with spaces
          const hasSpaces = arg.includes(' ');
          // Quote filter values (contain brackets or semicolons) - these follow -filter_complex, -vf, -af
          const prevArg = index > 0 ? args[index - 1] : '';
          const isFilterValue = ['-filter_complex', '-vf', '-af', '-lavfi'].includes(prevArg);
          // Also quote if it contains shell special chars like [ ] ; and isn't a flag
          const hasSpecialChars = (arg.includes('[') || arg.includes(';')) && !arg.startsWith('-');
          
          if (isFilePath || hasSpaces || isFilterValue || hasSpecialChars) {
            return `"${arg}"`;
          }
          return arg;
        });
        
        // Build command - use the local ffmpeg path which has no spaces
        const command = `"${ffmpeg_bin}" ${quotedArgs.join(' ')}`;
        console.log('Running FFmpeg (Windows):', command.substring(0, 500) + '...');
        
        exec(command, { cwd: this.workDir, maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
          if (error) {
            console.error('FFmpeg stderr:', stderr);
            reject(new Error(`FFmpeg exited with code ${error.code}: ${stderr.slice(-500)}`));
          } else {
            resolve();
          }
        });
      } else {
        // Unix - use spawn without shell
        console.log('Running FFmpeg:', ffmpeg_bin);
        console.log('Args:', args);
        
        const ffmpeg = spawn(ffmpeg_bin, args, {
          cwd: this.workDir
        });

        let stderr = '';
        
        ffmpeg.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpeg.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            console.error('FFmpeg stderr:', stderr);
            reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
          }
        });

        ffmpeg.on('error', (error) => {
          reject(new Error(`FFmpeg spawn error: ${error.message}`));
        });
      }
    });
  }

  // Normalize video clips to same format
  private async normalizeClip(inputPath: string, outputPath: string): Promise<void> {
    const args = [
      '-y',
      '-i', inputPath,
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,fps=30,format=yuv420p',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-an', // Remove audio from individual clips
      outputPath
    ];
    
    await this.runFFmpeg(args);
  }

  // Combine video clips into one continuous video
  async combineClips(assets: DownloadedAssets): Promise<string> {
    await this.updateProgress('Normalizing video clips...', 30, 'processing');
    
    const outputPath = path.join(this.workDir, 'combined.mp4');
    const clips: string[] = [];
    const normalizedClips: string[] = [];

    // Determine which clips we have
    if (assets.visual_hook) clips.push(assets.visual_hook);
    if (assets.pain_story) clips.push(assets.pain_story);
    if (assets.product_demo) clips.push(assets.product_demo);
    if (assets.cta_closer) clips.push(assets.cta_closer);

    if (clips.length === 0) {
      throw new Error('No video clips available to combine');
    }

    // Normalize each clip
    for (let i = 0; i < clips.length; i++) {
      await this.updateProgress(`Normalizing clip ${i + 1}/${clips.length}...`, 30 + Math.floor((i / clips.length) * 15));
      const normalizedPath = path.join(this.workDir, `normalized_${i}.mp4`);
      await this.normalizeClip(clips[i], normalizedPath);
      normalizedClips.push(normalizedPath);
    }

    await this.updateProgress('Concatenating clips...', 50);

    // Create concat list file
    const concatListPath = path.join(this.workDir, 'concat_list.txt');
    const concatContent = normalizedClips.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);

    // Concatenate clips
    const args = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c', 'copy',
      outputPath
    ];

    await this.runFFmpeg(args);
    return outputPath;
  }

  // Add audio tracks (voiceover + background music)
  async addAudio(videoPath: string, assets: DownloadedAssets): Promise<string> {
    await this.updateProgress('Adding audio tracks...', 55);
    
    const outputPath = path.join(this.workDir, 'with_audio.mp4');
    const { audioConfig } = CONTRACTOR_AD_TEMPLATE;
    
    // Build filter complex for audio mixing
    const inputs: string[] = ['-i', videoPath];
    const filterParts: string[] = [];
    let audioInputIndex = 1;
    
    // Add voiceover
    if (assets.voiceover) {
      inputs.push('-i', assets.voiceover);
      filterParts.push(`[${audioInputIndex}:a]volume=${audioConfig.voiceoverVolume}[vo]`);
      audioInputIndex++;
    }

    // Add background music with fade
    if (assets.background_music) {
      inputs.push('-i', assets.background_music);
      filterParts.push(
        `[${audioInputIndex}:a]volume=${audioConfig.backgroundMusicVolume},` +
        `afade=t=in:st=0:d=${audioConfig.backgroundMusicFadeIn},` +
        `afade=t=out:st=67:d=${audioConfig.backgroundMusicFadeOut}[music]`
      );
      audioInputIndex++;
    }

    // Add sound effects
    for (let i = 0; i < assets.sound_effects.length; i++) {
      const sfx = assets.sound_effects[i];
      inputs.push('-i', sfx.path);
      filterParts.push(`[${audioInputIndex}:a]volume=${sfx.volume},adelay=${Math.floor(sfx.timing * 1000)}|${Math.floor(sfx.timing * 1000)}[sfx${i}]`);
      audioInputIndex++;
    }

    // Mix all audio streams
    const audioStreams: string[] = [];
    
    if (assets.voiceover) audioStreams.push('[vo]');
    if (assets.background_music) audioStreams.push('[music]');
    assets.sound_effects.forEach((_, i) => audioStreams.push(`[sfx${i}]`));

    if (audioStreams.length > 0) {
      const mixFilter = `${audioStreams.join('')}amix=inputs=${audioStreams.length}:duration=first:dropout_transition=2[aout]`;
      filterParts.push(mixFilter);
    }

    const args = [
      '-y',
      ...inputs,
      '-filter_complex', filterParts.join(';'),
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      outputPath
    ];

    // If no audio, just copy video
    if (audioStreams.length === 0) {
      fs.copyFileSync(videoPath, outputPath);
      return outputPath;
    }

    await this.runFFmpeg(args);
    return outputPath;
  }

  // Build FFmpeg drawtext filter for text overlays
  private buildTextOverlayFilter(overlays: TextOverlay[]): string {
    const filters: string[] = [];
    
    for (const overlay of overlays) {
      const x = overlay.position.x === 'center' ? '(w-text_w)/2' : overlay.position.x.toString();
      const y = overlay.position.y === 'center' ? '(h-text_h)/2' : overlay.position.y.toString();
      
      let fontFile = '';
      if (overlay.font === 'Bungee' && fs.existsSync(this.fontPath)) {
        fontFile = `:fontfile='${this.fontPath.replace(/\\/g, '/')}'`;
      }
      
      let boxOptions = '';
      if (overlay.backgroundColor) {
        const bgColor = overlay.backgroundColor.replace('#', '');
        boxOptions = `:box=1:boxcolor=0x${bgColor}@1:boxborderw=10`;
      }
      
      const enable = `enable='between(t,${overlay.timing.start},${overlay.timing.end})'`;
      const fontColor = overlay.fontColor.replace('#', '');
      
      // Escape special characters in text
      const escapedText = overlay.text
        .replace(/'/g, "'\\''")
        .replace(/:/g, '\\:')
        .replace(/\\/g, '\\\\');
      
      filters.push(
        `drawtext=text='${escapedText}'${fontFile}:fontsize=${overlay.fontSize}:fontcolor=0x${fontColor}:x=${x}:y=${y}${boxOptions}:${enable}`
      );
    }
    
    return filters.join(',');
  }

  // Add text overlays to video
  async addTextOverlays(videoPath: string): Promise<string> {
    await this.updateProgress('Adding text overlays...', 70);
    
    const outputPath = path.join(this.workDir, 'with_text.mp4');
    const textFilter = this.buildTextOverlayFilter(CONTRACTOR_AD_TEMPLATE.textOverlays);
    
    if (!textFilter) {
      fs.copyFileSync(videoPath, outputPath);
      return outputPath;
    }

    const args = [
      '-y',
      '-i', videoPath,
      '-vf', textFilter,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'copy',
      outputPath
    ];

    await this.runFFmpeg(args);
    return outputPath;
  }

  // Add video effects (grayscale segments, etc.)
  async addEffects(videoPath: string): Promise<string> {
    await this.updateProgress('Adding video effects...', 80);
    
    const outputPath = path.join(this.workDir, 'with_effects.mp4');
    
    // Build filter for grayscale section (3-6 seconds)
    const grayscaleFilter = "geq=lum='lum(X,Y)':cb='128':cr='128':enable='between(t,3,6)'";
    
    const args = [
      '-y',
      '-i', videoPath,
      '-vf', grayscaleFilter,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'copy',
      outputPath
    ];

    await this.runFFmpeg(args);
    return outputPath;
  }

  // Final encoding pass for optimal output
  async finalEncode(videoPath: string): Promise<string> {
    await this.updateProgress('Final encoding...', 85, 'encoding');
    
    const outputPath = path.join(this.workDir, 'final.mp4');
    
    const args = [
      '-y',
      '-i', videoPath,
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '20',
      '-profile:v', 'high',
      '-level:v', '4.1',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      outputPath
    ];

    await this.runFFmpeg(args);
    return outputPath;
  }

  // Upload final video to Supabase Storage
  async uploadToSupabase(videoPath: string, manifestId: string): Promise<string> {
    await this.updateProgress('Uploading final video...', 90, 'uploading');
    
    const fileName = `${this.jobId}_${Date.now()}.mp4`;
    const fileBuffer = fs.readFileSync(videoPath);
    
    const { data, error } = await supabase.storage
      .from('final-videos')
      .upload(fileName, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('final-videos')
      .getPublicUrl(fileName);

    await this.updateProgress('Complete!', 100, 'complete');
    
    return publicUrl;
  }

  // Main processing pipeline
  async processVideo(manifest: ManifestAssets): Promise<string> {
    try {
      await this.init();
      
      // 1. Download all assets
      const assets = await this.downloadAssets(manifest);
      
      // 2. Combine video clips
      let videoPath = await this.combineClips(assets);
      
      // 3. Add audio tracks
      videoPath = await this.addAudio(videoPath, assets);
      
      // 4. Add text overlays
      videoPath = await this.addTextOverlays(videoPath);
      
      // 5. Add video effects
      videoPath = await this.addEffects(videoPath);
      
      // 6. Final encode
      videoPath = await this.finalEncode(videoPath);
      
      // 7. Upload to Supabase
      const finalUrl = await this.uploadToSupabase(videoPath, manifest.manifest_id);
      
      // Update job with final URL
      await supabase
        .from('video_editing_jobs')
        .update({
          final_video_url: finalUrl,
          status: 'complete',
          completed_at: new Date().toISOString(),
          progress: 100
        })
        .eq('id', this.jobId);

      return finalUrl;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Video processing error:', error);
      
      await supabase
        .from('video_editing_jobs')
        .update({
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', this.jobId);
      
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Helper function to create a new editing job
export async function createVideoEditingJob(manifestId: string): Promise<string> {
  const { data, error } = await supabase
    .from('video_editing_jobs')
    .insert({
      manifest_id: manifestId,
      status: 'queued',
      progress: 0,
      current_step: 'Queued for processing',
      started_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create job: ${error.message}`);
  }

  return data.id;
}

// Helper function to get job status
export async function getVideoEditingJob(jobId: string): Promise<VideoEditingJob | null> {
  const { data, error } = await supabase
    .from('video_editing_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    console.error('Failed to get job:', error);
    return null;
  }

  return data;
}

