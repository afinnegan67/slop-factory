'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Video, Settings, RefreshCw, CheckCircle, Clock, AlertCircle, Mic, FileText, Wand2, Facebook, DollarSign, Zap, ArrowRight, Brain, Layers, Activity, Search, ThumbsUp, Loader2, X, ImageIcon, Sparkles, ChevronDown, Save, ExternalLink, Package, Music, Volume2, Film, CheckCircle2, Circle, Lock } from 'lucide-react';

// Types matching new schema
interface PainPoint {
  id: string;
  title: string;
  description: string;
  visceral_trigger: string;
  emotional_impact_score: number | null;
  usage_count: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  price_cents: number;
  value_proposition: string;
  key_features: Record<string, unknown> | null;
  guarantees: string[] | null;
  is_active: boolean;
}

interface HookBrief {
  id: string;
  batch_id: string;
  title: string;
  visual_description: string;
  spoken_hook: string;
  text_overlay: string;
  copy_super: string;
  product_name?: string;
  product_id?: string;
}

interface SavedHookBrief {
  id: string;
  batch_id: string;
  title: string;
  visual_description: string;
  spoken_hook: string;
  text_overlay: string;
  copy_super: string;
  created_at: string;
  batch?: {
    id: string;
    pain_point_id: string;
    product_id: string;
    pain_point?: { id: string; title: string; emotional_impact_score: number | null };
    product?: { id: string; name: string; price_cents: number };
  };
}

interface AdScript {
  visceral_hook: string;
  pain_elaboration: string;
  solution_intro: string;
  product_pitch: string;
  price_reveal: string;
  cta: string;
  full_script?: string;
  estimated_duration_seconds?: number;
}

interface SoraPrompt {
  prompt: string;
  duration_seconds: number;
  purpose: string;
}

interface SoraPrompts {
  visual_hook: SoraPrompt;
  pain_story: SoraPrompt;
  cta_closer: SoraPrompt;
}

export default function SlopFactoryDashboard() {
  const [activeTab, setActiveTab] = useState('script');
  
  // Research state
  const [researchTopic, setResearchTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchStatus, setResearchStatus] = useState('');
  const [researchOutput, setResearchOutput] = useState('');
  const [extractedPainPoints, setExtractedPainPoints] = useState<PainPoint[]>([]);
  const [researchError, setResearchError] = useState<string | null>(null);
  const researchOutputRef = useRef<HTMLDivElement>(null);
  
  // Pain points & products state
  const [savedPainPoints, setSavedPainPoints] = useState<PainPoint[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPainPoint, setSelectedPainPoint] = useState<PainPoint | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedExtractedIndexes, setSelectedExtractedIndexes] = useState<Set<number>>(new Set());
  
  // Hook brief state
  const [isGeneratingBriefs, setIsGeneratingBriefs] = useState(false);
  const [briefsOutput, setBriefsOutput] = useState('');
  const [generatedBriefs, setGeneratedBriefs] = useState<HookBrief[]>([]);
  const [briefsStatus, setBriefsStatus] = useState('');
  const [editableBriefs, setEditableBriefs] = useState<HookBrief[]>([]);
  const [selectedBriefIndexes, setSelectedBriefIndexes] = useState<Set<number>>(new Set());
  const briefsCarouselRef = useRef<HTMLDivElement>(null);

  // Ad Script Generation state
  const [savedHookBriefs, setSavedHookBriefs] = useState<SavedHookBrief[]>([]);
  const [selectedSavedBrief, setSelectedSavedBrief] = useState<SavedHookBrief | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptOutput, setScriptOutput] = useState('');
  const [generatedScript, setGeneratedScript] = useState<AdScript | null>(null);
  const [editableScript, setEditableScript] = useState<AdScript | null>(null);
  const [scriptStatus, setScriptStatus] = useState('');
  const [isLoadingBriefs, setIsLoadingBriefs] = useState(false);

  // Audio Generation state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Sora Prompts state
  const [isGeneratingSora, setIsGeneratingSora] = useState(false);
  const [soraOutput, setSoraOutput] = useState('');
  const [soraPrompts, setSoraPrompts] = useState<SoraPrompts | null>(null);
  const [editableSoraPrompts, setEditableSoraPrompts] = useState<SoraPrompts | null>(null);
  const [soraStatus, setSoraStatus] = useState('');

  // Sora Video Generation state
  const [isGeneratingSoraVideos, setIsGeneratingSoraVideos] = useState(false);
  const [isGeneratingSingleVideo, setIsGeneratingSingleVideo] = useState<{
    visual_hook: boolean;
    pain_story: boolean;
    cta_closer: boolean;
  }>({ visual_hook: false, pain_story: false, cta_closer: false });
  const [singleVideoUrls, setSingleVideoUrls] = useState<{
    visual_hook: string | null;
    pain_story: string | null;
    cta_closer: string | null;
  }>({ visual_hook: null, pain_story: null, cta_closer: null });
  const [soraVideoIds, setSoraVideoIds] = useState<{
    visual_hook: string;
    pain_story: string;
    cta_closer: string;
  } | null>(null);
  const [soraVideoStatus, setSoraVideoStatus] = useState<{
    visual_hook: { status: string; progress: number };
    pain_story: { status: string; progress: number };
    cta_closer: { status: string; progress: number };
  } | null>(null);
  const [soraVideoError, setSoraVideoError] = useState<string | null>(null);

  // Stored Sora Generations
  interface SoraGeneration {
    id: string;
    sora_generation_id: string;
    sora_prompt_used: string;
    processing_status: string;
    raw_url: string | null;
    created_at: string;
    completed_at: string | null;
    last_error: string | null;
  }
  const [storedSoraGenerations, setStoredSoraGenerations] = useState<SoraGeneration[]>([]);
  const [isLoadingSoraGenerations, setIsLoadingSoraGenerations] = useState(false);
  const [isSoraLibraryExpanded, setIsSoraLibraryExpanded] = useState(false);

  // Asset Checklist state
  interface AssetChecklist {
    sora_videos: {
      ready: boolean;
      count: number;
      required: number;
      videos: Array<{ id: string; sora_generation_id: string; status: string; url: string | null; prompt_preview: string }>;
    };
    voiceover: {
      ready: boolean;
      url: string | null;
    };
    product_demo: {
      ready: boolean;
      product_name: string | null;
      url: string | null;
    };
    background_music: {
      ready: boolean;
      count: number;
      tracks: Array<{ id: string; name: string; url: string }>;
    };
    sound_effects: {
      ready: boolean;
      count: number;
      effects: Array<{ id: string; name: string; url: string }>;
    };
  }
  const [assetChecklist, setAssetChecklist] = useState<AssetChecklist | null>(null);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(true);
  const [isInitializingEditor, setIsInitializingEditor] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  // Asset Manifest state for video editing
  interface SoraVideoAsset {
    id: string;
    sora_generation_id: string;
    sora_prompt_used: string;
    processing_status: string;
    raw_url: string | null;
    processed_url: string | null;
    created_at: string;
  }
  interface MediaAsset {
    id: string;
    asset_name: string;
    file_url: string;
    duration_seconds: number | null;
    tags: string[] | null;
  }
  interface ProductDemoAsset {
    id: string;
    demo_video_url: string;
    demo_duration_seconds?: number | null;
    asset_name?: string;
    products?: { id: string; name: string; price_cents: number };
  }
  interface AvailableAssets {
    sora_videos: {
      visual_hook: SoraVideoAsset[];
      pain_story: SoraVideoAsset[];
      cta_closer: SoraVideoAsset[];
      uncategorized: SoraVideoAsset[];
    };
    all_sora_videos: SoraVideoAsset[];
    background_music: MediaAsset[];
    sound_effects: MediaAsset[];
    product_demos: ProductDemoAsset[];
    voiceover: { batch_id: string | null; audio_url: string | null };
  }
  interface ManifestSelections {
    visual_hook: SoraVideoAsset | null;
    pain_story: SoraVideoAsset | null;
    cta_closer: SoraVideoAsset | null;
    voiceover_batch_id: string | null;
    product_demo: ProductDemoAsset | null;
    background_music: MediaAsset | null;
    sound_effects: Array<{ effect_id: string; timing: number; volume: number; asset?: MediaAsset }>;
    caption_style: string;
    transition_style: string;
  }
  const [availableAssets, setAvailableAssets] = useState<AvailableAssets | null>(null);
  const [manifestSelections, setManifestSelections] = useState<ManifestSelections>({
    visual_hook: null,
    pain_story: null,
    cta_closer: null,
    voiceover_batch_id: null,
    product_demo: null,
    background_music: null,
    sound_effects: [],
    caption_style: 'bold_yellow',
    transition_style: 'hard_cuts'
  });
  const [manifestId, setManifestId] = useState<string | null>(null);
  const [isManifestLocked, setIsManifestLocked] = useState(false);
  const [isSavingManifest, setIsSavingManifest] = useState(false);
  const [manifestStatus, setManifestStatus] = useState<string>('');
  const [savedDrafts, setSavedDrafts] = useState<Array<{
    id: string;
    batch_id: string;
    is_locked: boolean;
    created_at: string;
    updated_at: string;
    resolved_assets?: Record<string, unknown>;
    draft_name?: string;
  }>>([]);
  const [showDraftsPanel, setShowDraftsPanel] = useState(false);
  const [draftName, setDraftName] = useState('');

  // Video Editing Job state
  interface VideoEditingJob {
    id: string;
    manifest_id: string;
    status: 'queued' | 'downloading' | 'processing' | 'encoding' | 'uploading' | 'complete' | 'failed';
    progress: number;
    current_step: string;
    final_video_url: string | null;
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
  }
  const [currentVideoJob, setCurrentVideoJob] = useState<VideoEditingJob | null>(null);
  const [isStartingVideoGeneration, setIsStartingVideoGeneration] = useState(false);
  const videoJobPollRef = useRef<NodeJS.Timeout | null>(null);

  // Generated Ads state
  interface GeneratedAd {
    id: string;
    manifest_id: string;
    status: string;
    final_video_url: string | null;
    created_at: string;
    completed_at: string | null;
    draft_name?: string;
  }
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [isLoadingAds, setIsLoadingAds] = useState(false);

  const tabs = [
    { id: 'script', name: 'Research', icon: FileText },
    { id: 'concept', name: 'Concept', icon: Sparkles },
    { id: 'videogen', name: 'Video Gen', icon: Film },
    { id: 'video', name: 'Video Editing', icon: Video },
    { id: 'ads', name: 'Generated Ads', icon: Play },
    { id: 'meta', name: 'Meta', icon: Facebook }
  ];

  // Load products, saved pain points, and hook briefs on mount
  useEffect(() => {
    loadProducts();
    loadPainPoints();
    loadSavedHookBriefs();
  }, []);

  // Refresh saved hook briefs when switching to script tab
  useEffect(() => {
    if (activeTab === 'script' || activeTab === 'concept') {
      loadSavedHookBriefs();
    }
    if (activeTab === 'video' || activeTab === 'videogen') {
      loadSoraGenerations();
    }
  }, [activeTab]);

  // Auto-scroll to the selected tab content for clarity
  useEffect(() => {
    const targetId = activeTab === 'concept' ? 'concept-section' : activeTab === 'script' ? 'script-section' : null;
    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab]);

  // Load stored Sora generations
  const loadSoraGenerations = async () => {
    setIsLoadingSoraGenerations(true);
    try {
      const res = await fetch('/api/sora-videos');
      const data = await res.json();
      if (data.generations) {
        setStoredSoraGenerations(data.generations);
      }
    } catch (e) {
      console.error('Failed to load sora generations:', e);
    } finally {
      setIsLoadingSoraGenerations(false);
    }
  };

  // Load asset checklist for editor preparation
  const loadAssetChecklist = async (batchId: string) => {
    setIsLoadingChecklist(true);
    try {
      const res = await fetch(`/api/editor/prepare-package?batch_id=${batchId}`);
      const data = await res.json();
      if (data.checklist) {
        setAssetChecklist(data.checklist);
        setCurrentBatchId(batchId);
      }
    } catch (e) {
      console.error('Failed to load asset checklist:', e);
    } finally {
      setIsLoadingChecklist(false);
    }
  };

  // Initialize editor with prepared package
  const initializeEditor = async () => {
    if (!currentBatchId) return;
    
    setIsInitializingEditor(true);
    try {
      const res = await fetch('/api/editor/prepare-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: currentBatchId })
      });
      const data = await res.json();
      
      if (data.success) {
        // Navigate to video editing tab
        setActiveTab('video');
      } else {
        console.error('Failed to initialize editor:', data.error);
      }
    } catch (e) {
      console.error('Failed to initialize editor:', e);
    } finally {
      setIsInitializingEditor(false);
    }
  };

  // Load available assets for manifest configuration
  const loadAvailableAssets = async () => {
    try {
      setManifestStatus('Loading available assets...');
      // Use load_recent=true to get recent videos regardless of batch_id
      const res = await fetch('/api/manifests?load_recent=true');
      const data = await res.json();
      
      if (data.success) {
        setAvailableAssets(data.available_assets);
        
        // Set the batch_id from the response (most recent batch with audio)
        if (data.batch_id) {
          setCurrentBatchId(data.batch_id);
        }
        
        // If there's an existing manifest, load its selections
        if (data.manifest) {
          setManifestId(data.manifest.id);
          setIsManifestLocked(data.manifest.is_locked);
          
          // Find and set the selected assets from the manifest
          const allVideos = data.available_assets.all_sora_videos || [];
          setManifestSelections({
            visual_hook: allVideos.find((v: SoraVideoAsset) => v.id === data.manifest.visual_hook_video_id) || null,
            pain_story: allVideos.find((v: SoraVideoAsset) => v.id === data.manifest.pain_story_video_id) || null,
            cta_closer: allVideos.find((v: SoraVideoAsset) => v.id === data.manifest.cta_closer_video_id) || null,
            voiceover_batch_id: data.manifest.voiceover_batch_id,
            product_demo: data.available_assets.product_demos?.find((d: ProductDemoAsset) => d.id === data.manifest.product_demo_id) || null,
            background_music: data.available_assets.background_music?.find((m: MediaAsset) => m.id === data.manifest.background_music_id) || null,
            sound_effects: data.manifest.sound_effects || [],
            caption_style: data.manifest.caption_style || 'bold_yellow',
            transition_style: data.manifest.transition_style || 'hard_cuts'
          });
        }
        
        // Auto-select voiceover batch
        if (data.available_assets.voiceover?.batch_id) {
          setCurrentBatchId(data.available_assets.voiceover.batch_id);
          setManifestSelections(prev => ({
            ...prev,
            voiceover_batch_id: data.available_assets.voiceover.batch_id
          }));
        }
        
        const videoCount = data.available_assets.all_sora_videos?.length || 0;
        const hasAudio = !!data.available_assets.voiceover?.audio_url;
        setManifestStatus(`✅ Loaded ${videoCount} videos${hasAudio ? ' + voiceover' : ''}`);
      } else {
        setManifestStatus(`❌ ${data.error || 'Failed to load assets'}`);
      }
    } catch (e) {
      console.error('Failed to load available assets:', e);
      setManifestStatus('❌ Failed to load assets');
    }
  };

  // Save manifest selections
  const saveManifest = async (lockAfterSave = false) => {
    // Use voiceover batch_id if no currentBatchId
    const batchId = currentBatchId || manifestSelections.voiceover_batch_id;
    
    if (!batchId) {
      setManifestStatus('❌ No batch available - generate voiceover first');
      return;
    }
    
    setIsSavingManifest(true);
    setManifestStatus('Saving manifest...');
    
    try {
      // Build the resolved assets "treasure map" with all URLs
      const resolvedAssets = {
        sora_videos: {
          visual_hook: manifestSelections.visual_hook ? {
            id: manifestSelections.visual_hook.id,
            url: manifestSelections.visual_hook.raw_url || manifestSelections.visual_hook.processed_url,
            prompt: manifestSelections.visual_hook.sora_prompt_used
          } : null,
          pain_story: manifestSelections.pain_story ? {
            id: manifestSelections.pain_story.id,
            url: manifestSelections.pain_story.raw_url || manifestSelections.pain_story.processed_url,
            prompt: manifestSelections.pain_story.sora_prompt_used
          } : null,
          cta_closer: manifestSelections.cta_closer ? {
            id: manifestSelections.cta_closer.id,
            url: manifestSelections.cta_closer.raw_url || manifestSelections.cta_closer.processed_url,
            prompt: manifestSelections.cta_closer.sora_prompt_used
          } : null
        },
        voiceover: {
          batch_id: manifestSelections.voiceover_batch_id || batchId,
          url: availableAssets?.voiceover?.audio_url
        },
        background_music: manifestSelections.background_music ? {
          id: manifestSelections.background_music.id,
          name: manifestSelections.background_music.asset_name,
          url: manifestSelections.background_music.file_url
        } : null,
        sound_effects: manifestSelections.sound_effects.map(sfx => ({
          id: sfx.effect_id,
          name: sfx.asset?.asset_name,
          url: sfx.asset?.file_url,
          timing: sfx.timing,
          volume: sfx.volume
        })),
        product_demo: manifestSelections.product_demo ? {
          id: manifestSelections.product_demo.id,
          name: manifestSelections.product_demo.asset_name,
          url: manifestSelections.product_demo.demo_video_url
        } : null,
        settings: {
          caption_style: manifestSelections.caption_style,
          transition_style: manifestSelections.transition_style
        }
      };

      const res = await fetch('/api/manifests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          draft_name: draftName || `Draft ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          visual_hook_video_id: manifestSelections.visual_hook?.id,
          pain_story_video_id: manifestSelections.pain_story?.id,
          cta_closer_video_id: manifestSelections.cta_closer?.id,
          voiceover_batch_id: manifestSelections.voiceover_batch_id || batchId,
          product_demo_id: manifestSelections.product_demo?.id,
          background_music_id: manifestSelections.background_music?.id,
          sound_effects: manifestSelections.sound_effects,
          caption_style: manifestSelections.caption_style,
          transition_style: manifestSelections.transition_style,
          is_locked: lockAfterSave,
          resolved_assets: resolvedAssets // The "treasure map" for the AI agent
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setManifestId(data.manifest.id);
        setIsManifestLocked(data.manifest.is_locked);
        
        // If locking (Create Ad), send assets to n8n webhook for video editing
        if (lockAfterSave) {
          setManifestStatus('📤 Sending assets to video editor...');
          try {
            const webhookPayload = {
              manifest_id: data.manifest.id,
              draft_name: draftName || `Draft ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
              assets: {
                visual_hook_video: resolvedAssets.sora_videos.visual_hook?.url || null,
                pain_story_video: resolvedAssets.sora_videos.pain_story?.url || null,
                cta_closer_video: resolvedAssets.sora_videos.cta_closer?.url || null,
                voiceover_audio: resolvedAssets.voiceover.url || null,
                background_music: resolvedAssets.background_music?.url || null,
                product_demo_video: resolvedAssets.product_demo?.url || null,
                sound_effects: resolvedAssets.sound_effects.map(sfx => sfx.url).filter(Boolean)
              },
              settings: resolvedAssets.settings,
              full_resolved_assets: resolvedAssets
            };
            
            const webhookRes = await fetch('https://n8n.opulencefunnels.com/webhook/57a145a4-69ef-44df-bd73-d015c2523b19', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(webhookPayload)
            });
            
            if (webhookRes.ok) {
              setManifestStatus('✅ Ad created! Assets sent to video editor successfully.');
            } else {
              console.error('Webhook response not ok:', webhookRes.status);
              setManifestStatus('✅ Manifest locked, but webhook delivery had issues. Check console.');
            }
          } catch (webhookError) {
            console.error('Failed to send to n8n webhook:', webhookError);
            setManifestStatus('✅ Manifest locked, but failed to send to video editor. Check console.');
          }
        } else {
          setManifestStatus('✅ Draft saved! Agent endpoint ready.');
        }
        
        // Refresh saved drafts list
        loadSavedDrafts();
      } else {
        setManifestStatus(`❌ ${data.error}`);
      }
    } catch (e) {
      console.error('Failed to save manifest:', e);
      setManifestStatus('❌ Failed to save manifest');
    } finally {
      setIsSavingManifest(false);
    }
  };

  // Load all saved drafts/manifests
  const loadSavedDrafts = async () => {
    try {
      const res = await fetch('/api/manifests');
      const data = await res.json();
      if (data.success && data.manifests) {
        setSavedDrafts(data.manifests);
      }
    } catch (e) {
      console.error('Failed to load saved drafts:', e);
    }
  };

  // Start video generation job
  const startVideoGeneration = async () => {
    if (!manifestId || !isManifestLocked) {
      setManifestStatus('❌ Manifest must be locked first');
      return;
    }

    setIsStartingVideoGeneration(true);
    setManifestStatus('🎬 Starting video generation...');

    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest_id: manifestId })
      });

      const data = await res.json();

      if (data.success && data.job_id) {
        setCurrentVideoJob({
          id: data.job_id,
          manifest_id: manifestId,
          status: 'queued',
          progress: 0,
          current_step: 'Queued for processing',
          final_video_url: null,
          error_message: null,
          started_at: new Date().toISOString(),
          completed_at: null
        });

        // Start polling for job status
        startJobPolling(data.job_id);
        setManifestStatus('🎬 Video generation started! Tracking progress...');
      } else {
        setManifestStatus(`❌ Failed to start: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to start video generation:', error);
      setManifestStatus('❌ Failed to start video generation');
    } finally {
      setIsStartingVideoGeneration(false);
    }
  };

  // Poll for job status updates
  const startJobPolling = (jobId: string) => {
    // Clear any existing poll
    if (videoJobPollRef.current) {
      clearInterval(videoJobPollRef.current);
    }

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/video/status?job_id=${jobId}`);
        const data = await res.json();

        if (data.success && data.job) {
          setCurrentVideoJob(data.job);

          // Update manifest status based on job status
          if (data.job.status === 'complete') {
            setManifestStatus('✅ Video generated successfully!');
            if (videoJobPollRef.current) {
              clearInterval(videoJobPollRef.current);
              videoJobPollRef.current = null;
            }
          } else if (data.job.status === 'failed') {
            setManifestStatus(`❌ Video generation failed: ${data.job.error_message || 'Unknown error'}`);
            if (videoJobPollRef.current) {
              clearInterval(videoJobPollRef.current);
              videoJobPollRef.current = null;
            }
          } else {
            setManifestStatus(`🎬 ${data.job.current_step} (${data.job.progress}%)`);
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    };

    // Poll immediately, then every 2 seconds
    pollStatus();
    videoJobPollRef.current = setInterval(pollStatus, 2000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (videoJobPollRef.current) {
        clearInterval(videoJobPollRef.current);
      }
    };
  }, []);

  // Load generated ads from video_editing_jobs table
  const loadGeneratedAds = async () => {
    setIsLoadingAds(true);
    try {
      const res = await fetch('/api/video/status');
      const data = await res.json();
      
      if (data.success && data.jobs) {
        // Filter to only completed jobs with video URLs, and enrich with manifest data
        const completedAds = data.jobs.filter((job: GeneratedAd) => 
          job.status === 'complete' && job.final_video_url
        );
        
        // Try to get draft names from manifests
        const enrichedAds = await Promise.all(completedAds.map(async (job: GeneratedAd) => {
          try {
            const manifestRes = await fetch(`/api/manifests?manifest_id=${job.manifest_id}`);
            const manifestData = await manifestRes.json();
            return {
              ...job,
              draft_name: manifestData.manifest?.draft_name || `Ad ${job.id.slice(0, 8)}`
            };
          } catch {
            return { ...job, draft_name: `Ad ${job.id.slice(0, 8)}` };
          }
        }));
        
        setGeneratedAds(enrichedAds);
      }
    } catch (error) {
      console.error('Failed to load generated ads:', error);
    } finally {
      setIsLoadingAds(false);
    }
  };

  // Load ads when switching to ads tab
  useEffect(() => {
    if (activeTab === 'ads') {
      loadGeneratedAds();
    }
  }, [activeTab]);

  // Load a specific draft and populate the selections
  const loadDraft = async (draftId: string) => {
    try {
      setManifestStatus('Loading draft...');
      
      // First load the manifest
      const manifestRes = await fetch(`/api/manifests?manifest_id=${draftId}`);
      const manifestData = await manifestRes.json();
      
      if (!manifestData.success) {
        setManifestStatus('❌ Failed to load draft');
        return;
      }

      const manifest = manifestData.manifest;
      setManifestId(manifest.id);
      setCurrentBatchId(manifest.batch_id);
      setIsManifestLocked(manifest.is_locked);

      // Now load the available assets to get the full objects
      await loadAvailableAssets();

      // Wait a bit for assets to load, then set selections based on manifest IDs
      setTimeout(() => {
        if (availableAssets) {
          const allVideos = availableAssets.all_sora_videos || [];
          setManifestSelections(prev => ({
            ...prev,
            visual_hook: allVideos.find((v: SoraVideoAsset) => v.id === manifest.visual_hook_video_id) || null,
            pain_story: allVideos.find((v: SoraVideoAsset) => v.id === manifest.pain_story_video_id) || null,
            cta_closer: allVideos.find((v: SoraVideoAsset) => v.id === manifest.cta_closer_video_id) || null,
            voiceover_batch_id: manifest.voiceover_batch_id,
            product_demo: availableAssets.product_demos?.find((d: ProductDemoAsset) => d.id === manifest.product_demo_id) || null,
            background_music: availableAssets.background_music?.find((m: MediaAsset) => m.id === manifest.background_music_id) || null,
            sound_effects: manifest.sound_effects || [],
            caption_style: manifest.caption_style || 'bold_yellow',
            transition_style: manifest.transition_style || 'hard_cuts'
          }));
        }
        setManifestStatus('✅ Draft loaded - you can now edit or regenerate');
        setShowDraftsPanel(false);
      }, 500);

    } catch (e) {
      console.error('Failed to load draft:', e);
      setManifestStatus('❌ Failed to load draft');
    }
  };

  // Check if all required assets are selected
  const allManifestAssetsSelected = 
    manifestSelections.visual_hook &&
    manifestSelections.pain_story &&
    manifestSelections.cta_closer &&
    (manifestSelections.voiceover_batch_id || availableAssets?.voiceover?.audio_url) &&
    manifestSelections.background_music;

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (e) {
      console.error('Failed to load products:', e);
    }
  };

  const loadPainPoints = async () => {
    try {
      const res = await fetch('/api/pain-points');
      const data = await res.json();
      if (data.pain_points) setSavedPainPoints(data.pain_points);
    } catch (e) {
      console.error('Failed to load pain points:', e);
    }
  };

  const loadSavedHookBriefs = async () => {
    setIsLoadingBriefs(true);
    try {
      const res = await fetch('/api/hook-briefs');
      const data = await res.json();
      console.log('Loaded hook briefs:', data);
      if (data.hook_briefs) {
        setSavedHookBriefs(data.hook_briefs);
      } else if (data.error) {
        console.error('API error loading hook briefs:', data.error, data.details);
      }
    } catch (e) {
      console.error('Failed to load saved hook briefs:', e);
    } finally {
      setIsLoadingBriefs(false);
    }
  };

  // Auto-scroll research output
  useEffect(() => {
    if (researchOutputRef.current) {
      researchOutputRef.current.scrollTop = researchOutputRef.current.scrollHeight;
    }
  }, [researchOutput]);

  // Research mode toggle
  const [useDeepResearch, setUseDeepResearch] = useState(true);
  const [researchInputMode, setResearchInputMode] = useState<'generate' | 'upload'>('generate');
  const [uploadedResearch, setUploadedResearch] = useState('');

  // Stream research from an endpoint
  const streamResearch = async (endpoint: string) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: researchTopic,
        targetAudience: 'residential contractors'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to start research');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let hasError = false;
    let errorMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'status':
                setResearchStatus(data.message);
                break;
              case 'research_chunk':
                setResearchOutput(prev => prev + data.content);
                break;
              case 'pain_points':
                setExtractedPainPoints(data.data);
                break;
              case 'error':
                hasError = true;
                errorMessage = data.message;
                break;
              case 'complete':
                setResearchStatus(data.message || '✅ Research complete!');
                break;
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }

    if (hasError) {
      throw new Error(errorMessage);
    }
  };

  // Start streaming research
  const startResearch = async () => {
    if (!researchTopic.trim()) return;
    
    setIsResearching(true);
    setResearchError(null);
    setResearchOutput('');
    setExtractedPainPoints([]);
    setResearchStatus('Starting...');

    try {
      const endpoint = useDeepResearch ? '/api/research/stream' : '/api/research/fallback';
      setResearchStatus(useDeepResearch 
        ? '🚀 Starting OpenAI Deep Research (this will take 5-15 minutes)...' 
        : '⚡ Starting GPT-4o research...'
      );
      await streamResearch(endpoint);
    } catch (error) {
      console.error('Research failed:', error);
      setResearchError(error instanceof Error ? error.message : 'Research failed');
    } finally {
      setIsResearching(false);
    }
  };

  // Process uploaded/pasted research text
  const processUploadedResearch = async () => {
    if (!uploadedResearch.trim()) return;
    
    setIsResearching(true);
    setResearchError(null);
    setResearchOutput(uploadedResearch);
    setExtractedPainPoints([]);
    setResearchStatus('🎯 Extracting pain points from uploaded research...');

    try {
      const response = await fetch('/api/research/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ research: uploadedResearch })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract pain points');
      }

      if (data.pain_points) {
        setExtractedPainPoints(data.pain_points);
        setResearchStatus(`✅ Extracted ${data.pain_points.length} pain points from your research!`);
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      setResearchError(error instanceof Error ? error.message : 'Extraction failed');
    } finally {
      setIsResearching(false);
    }
  };

  // Toggle selection of an extracted pain point
  const togglePainPointSelection = (index: number) => {
    setSelectedExtractedIndexes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Select/deselect all pain points
  const toggleSelectAll = () => {
    if (selectedExtractedIndexes.size === extractedPainPoints.length) {
      setSelectedExtractedIndexes(new Set());
    } else {
      setSelectedExtractedIndexes(new Set(extractedPainPoints.map((_, i) => i)));
    }
  };

  // Save selected pain points to database
  const savePainPoints = async () => {
    if (selectedExtractedIndexes.size === 0) return;

    const selectedPoints = extractedPainPoints.filter((_, i) => selectedExtractedIndexes.has(i));

    try {
      const res = await fetch('/api/pain-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pain_points: selectedPoints })
      });

      const data = await res.json();
      if (data.success) {
        setSavedPainPoints(prev => [...data.pain_points, ...prev]);
        // Remove saved points from extracted list
        setExtractedPainPoints(prev => prev.filter((_, i) => !selectedExtractedIndexes.has(i)));
        setSelectedExtractedIndexes(new Set());
        setResearchStatus(`✅ Saved ${selectedPoints.length} pain points to database!`);
      }
    } catch (e) {
      console.error('Failed to save pain points:', e);
    }
  };

  // Generate hook briefs
  const generateHookBriefs = async () => {
    if (!selectedPainPoint || !selectedProduct) return;

    setIsGeneratingBriefs(true);
    setBriefsOutput('');
    setGeneratedBriefs([]);
    setBriefsStatus('Starting...');

    try {
      const response = await fetch('/api/hook-briefs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pain_point_id: selectedPainPoint.id,
          product_id: selectedProduct.id
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setBriefsStatus(data.message);
                  break;
                case 'generation_chunk':
                  setBriefsOutput(prev => prev + data.content);
                  break;
                case 'complete':
                  // Add product info to each brief
                  const briefsWithProduct = (data.hook_briefs || []).map((brief: HookBrief) => ({
                    ...brief,
                    product_name: selectedProduct?.name,
                    product_id: selectedProduct?.id
                  }));
                  setGeneratedBriefs(briefsWithProduct);
                  setEditableBriefs(briefsWithProduct);
                  setSelectedBriefIndexes(new Set());
                  setBriefsStatus(data.message);
                  break;
                case 'error':
                  setBriefsStatus(`❌ ${data.message}`);
                  break;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Brief generation failed:', error);
      setBriefsStatus('❌ Generation failed');
    } finally {
      setIsGeneratingBriefs(false);
    }
  };

  // Update an editable brief field
  const updateBriefField = (index: number, field: keyof HookBrief, value: string) => {
    setEditableBriefs(prev => prev.map((brief, i) => 
      i === index ? { ...brief, [field]: value } : brief
    ));
  };

  // Toggle brief selection
  const toggleBriefSelection = (index: number) => {
    setSelectedBriefIndexes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Store selected hook briefs
  const storeHookBriefs = async () => {
    const selectedBriefs = editableBriefs.filter((_, i) => selectedBriefIndexes.has(i));
    if (selectedBriefs.length === 0) {
      setBriefsStatus('⚠️ Please select at least one hook brief to store');
      return;
    }

    if (!selectedPainPoint || !selectedProduct) {
      setBriefsStatus('⚠️ Please select a pain point and product first');
      return;
    }

    setBriefsStatus('💾 Storing hook briefs...');
    
    try {
      const res = await fetch('/api/hook-briefs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefs: selectedBriefs.map(b => ({
            title: b.title,
            visual_description: b.visual_description,
            spoken_hook: b.spoken_hook,
            text_overlay: b.text_overlay,
            copy_super: b.copy_super,
            ai_generated_version: b
          })),
          batch_id: selectedBriefs[0]?.batch_id,
          pain_point_id: selectedPainPoint.id,
          product_id: selectedProduct.id
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      const data = await res.json();
      setBriefsStatus(`✅ Stored ${data.saved_count} hook briefs to database!`);
      // Remove stored briefs from the list
      setEditableBriefs(prev => prev.filter((_, i) => !selectedBriefIndexes.has(i)));
      setSelectedBriefIndexes(new Set());
      // Refresh the saved hook briefs library for the next section
      loadSavedHookBriefs();
    } catch (e) {
      console.error('Failed to store briefs:', e);
      setBriefsStatus(`❌ Failed to store hook briefs: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  // Scroll carousel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (briefsCarouselRef.current) {
      const scrollAmount = 400;
      briefsCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Generate ad script from selected hook brief
  const generateAdScript = async () => {
    if (!selectedSavedBrief) return;

    setIsGeneratingScript(true);
    setScriptOutput('');
    setGeneratedScript(null);
    setEditableScript(null);
    setScriptStatus('Starting...');

    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook_brief: {
            title: selectedSavedBrief.title,
            visual_description: selectedSavedBrief.visual_description,
            spoken_hook: selectedSavedBrief.spoken_hook,
            text_overlay: selectedSavedBrief.text_overlay,
            copy_super: selectedSavedBrief.copy_super
          },
          product: selectedSavedBrief.batch?.product,
          pain_point: selectedSavedBrief.batch?.pain_point
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setScriptStatus(data.message);
                  break;
                case 'generation_chunk':
                  setScriptOutput(prev => prev + data.content);
                  break;
                case 'complete':
                  setGeneratedScript(data.script);
                  setEditableScript(data.script);
                  setScriptStatus(data.message);
                  break;
                case 'error':
                  setScriptStatus(`❌ ${data.message}`);
                  break;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Script generation failed:', error);
      setScriptStatus('❌ Generation failed');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Update editable script section
  const updateScriptSection = (section: keyof AdScript, value: string) => {
    if (!editableScript) return;
    setEditableScript(prev => prev ? { ...prev, [section]: value } : null);
  };

  // Save the generated script
  const saveAdScript = async () => {
    if (!editableScript || !selectedSavedBrief) return;

    setScriptStatus('💾 Saving script...');
    
    try {
      const res = await fetch('/api/scripts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: editableScript,
          hook_brief_id: selectedSavedBrief.id
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      setScriptStatus('✅ Script saved to database!');
    } catch (e) {
      console.error('Failed to save script:', e);
      setScriptStatus(`❌ Failed to save script: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  // Generate audio from script using ElevenLabs
  const generateScriptAudio = async () => {
    if (!editableScript) {
      setAudioError('No script to generate audio from');
      return;
    }

    // Combine all script sections into one text
    const fullScript = [
      editableScript.visceral_hook,
      editableScript.pain_elaboration,
      editableScript.solution_intro,
      editableScript.product_pitch,
      editableScript.price_reveal,
      editableScript.cta,
    ].join(' ');

    console.log('=== GENERATING AUDIO ===');
    console.log('Script length:', fullScript.length);

    setIsGeneratingAudio(true);
    setAudioError(null);
    setAudioUrl(null);

    try {
      const response = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_text: fullScript }),
      });

      const data = await response.json();
      console.log('Audio response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate audio');
      }

      setAudioUrl(data.audio.url);
      console.log('Audio generated:', data.audio.url);

    } catch (error) {
      console.error('Audio generation error:', error);
      setAudioError(error instanceof Error ? error.message : 'Failed to generate audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Generate Sora prompts from the ad script
  const generateSoraPrompts = async () => {
    if (!editableScript) return;

    setIsGeneratingSora(true);
    setSoraOutput('');
    setSoraPrompts(null);
    setEditableSoraPrompts(null);
    setSoraStatus('Starting...');

    try {
      const response = await fetch('/api/sora-prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: editableScript,
          hook_brief: selectedSavedBrief ? {
            visual_description: selectedSavedBrief.visual_description,
            spoken_hook: selectedSavedBrief.spoken_hook
          } : null,
          product: selectedSavedBrief?.batch?.product
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setSoraStatus(data.message);
                  break;
                case 'generation_chunk':
                  setSoraOutput(prev => prev + data.content);
                  break;
                case 'complete':
                  setSoraPrompts(data.prompts);
                  setEditableSoraPrompts(data.prompts);
                  setSoraStatus(data.message);
                  break;
                case 'error':
                  setSoraStatus(`❌ ${data.message}`);
                  break;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Sora prompt generation failed:', error);
      setSoraStatus('❌ Generation failed');
    } finally {
      setIsGeneratingSora(false);
    }
  };

  // Update editable Sora prompt
  const updateSoraPrompt = (key: keyof SoraPrompts, field: keyof SoraPrompt, value: string | number) => {
    if (!editableSoraPrompts) return;
    setEditableSoraPrompts(prev => prev ? {
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    } : null);
  };

  // Generate Sora Videos (waits for completion server-side)
  const generateSoraVideos = async () => {
    if (!editableSoraPrompts) {
      console.error('No editable prompts available');
      setSoraVideoError('No prompts available. Generate prompts first.');
      return;
    }

    console.log('=== STARTING SORA VIDEO GENERATION ===');
    console.log('Prompts to send:', editableSoraPrompts);

    setIsGeneratingSoraVideos(true);
    setSoraVideoError(null);
    setSoraVideoStatus({
      visual_hook: { status: 'in_progress', progress: 0 },
      pain_story: { status: 'in_progress', progress: 0 },
      cta_closer: { status: 'in_progress', progress: 0 },
    });

    try {
      // This call waits for all videos to complete (5-15 minutes)
      console.log('Calling /api/sora-videos/generate (this may take 5-15 minutes)...');
      const response = await fetch('/api/sora-videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: editableSoraPrompts }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `API error ${response.status}: Failed to generate videos`);
      }

      if (!data.videos) {
        throw new Error('No videos returned from API');
      }

      console.log('=== ALL VIDEOS GENERATED SUCCESSFULLY ===');
      console.log('Videos:', data.videos);

      // Store video IDs
      setSoraVideoIds({
        visual_hook: data.videos.visual_hook.id,
        pain_story: data.videos.pain_story.id,
        cta_closer: data.videos.cta_closer.id,
      });

      // All videos are now complete with URLs
      setSoraVideoStatus({
        visual_hook: { status: 'completed', progress: 100 },
        pain_story: { status: 'completed', progress: 100 },
        cta_closer: { status: 'completed', progress: 100 },
      });

      // Refresh the sora generations list to show the new videos
      loadSoraGenerations();

    } catch (error) {
      console.error('=== SORA VIDEO GENERATION FAILED ===');
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate videos';
      setSoraVideoError(errorMessage);
    } finally {
      setIsGeneratingSoraVideos(false);
    }
  };

  // Generate single Sora video (for debugging)
  const generateSingleVideo = async (promptType: 'visual_hook' | 'pain_story' | 'cta_closer') => {
    if (!editableSoraPrompts) {
      setSoraVideoError('No prompts available');
      return;
    }

    const prompt = editableSoraPrompts[promptType].prompt;
    console.log(`=== GENERATING SINGLE VIDEO: ${promptType} ===`);
    console.log('Prompt:', prompt);

    setIsGeneratingSingleVideo(prev => ({ ...prev, [promptType]: true }));
    setSoraVideoError(null);

    try {
      const response = await fetch('/api/sora-videos/generate-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, prompt_type: promptType }),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video');
      }

      console.log(`=== SINGLE VIDEO COMPLETE: ${promptType} ===`);
      console.log('URL:', data.video.url);

      setSingleVideoUrls(prev => ({ ...prev, [promptType]: data.video.url }));
      
      // Refresh library
      loadSoraGenerations();

    } catch (error) {
      console.error(`=== SINGLE VIDEO FAILED: ${promptType} ===`);
      console.error('Error:', error);
      setSoraVideoError(error instanceof Error ? error.message : 'Failed to generate video');
    } finally {
      setIsGeneratingSingleVideo(prev => ({ ...prev, [promptType]: false }));
    }
  };

  // Poll video status
  const pollVideoStatus = async (videoIds: { visual_hook: string; pain_story: string; cta_closer: string }) => {
    console.log('=== STARTING VIDEO STATUS POLLING ===');
    console.log('Video IDs to poll:', videoIds);
    
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      pollCount++;
      console.log(`Poll #${pollCount} - Checking video status...`);
      
      try {
        const response = await fetch('/api/sora-videos/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_ids: videoIds }),
        });

        const data = await response.json();
        console.log(`Poll #${pollCount} - Response:`, data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check video status');
        }

        const newStatus = {
          visual_hook: { status: data.videos.visual_hook.status, progress: data.videos.visual_hook.progress },
          pain_story: { status: data.videos.pain_story.status, progress: data.videos.pain_story.progress },
          cta_closer: { status: data.videos.cta_closer.status, progress: data.videos.cta_closer.progress },
        };
        
        console.log(`Poll #${pollCount} - Status update:`, newStatus);
        setSoraVideoStatus(newStatus);

        // Check if all videos are done (completed or failed)
        const allDone = ['completed', 'failed'].includes(data.videos.visual_hook.status) &&
                       ['completed', 'failed'].includes(data.videos.pain_story.status) &&
                       ['completed', 'failed'].includes(data.videos.cta_closer.status);

        if (allDone) {
          console.log('=== ALL VIDEOS COMPLETE ===');
          clearInterval(pollInterval);
          setIsGeneratingSoraVideos(false);
          // Refresh the sora generations list
          loadSoraGenerations();
        }

      } catch (error) {
        console.error(`Poll #${pollCount} - ERROR:`, error);
        clearInterval(pollInterval);
        setIsGeneratingSoraVideos(false);
        setSoraVideoError(error instanceof Error ? error.message : 'Failed to check status');
      }
    }, 10000); // Poll every 10 seconds
  };

  // Get status color and icon
  const getVideoStatusDisplay = (status: string, progress: number) => {
    switch (status) {
      case 'completed':
        return { color: 'text-emerald-600', bg: 'bg-emerald-100', label: '✅ Complete' };
      case 'failed':
        return { color: 'text-red-600', bg: 'bg-red-100', label: '❌ Failed' };
      case 'in_progress':
        return { color: 'text-blue-600', bg: 'bg-blue-100', label: `⏳ ${progress}%` };
      case 'queued':
        return { color: 'text-amber-600', bg: 'bg-amber-100', label: '🕐 Queued' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', label: status };
    }
  };

  const scriptCreationContent = (
    <div id="script-section" className="space-y-8">
      {/* Deep Research Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Deep Research</h3>
              <p className="text-sm text-gray-500">Watch ChatGPT research contractor pain points in real-time</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          {/* Research Input Mode Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setResearchInputMode('generate')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                researchInputMode === 'generate'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🔬 Generate Research
            </button>
            <button
              onClick={() => setResearchInputMode('upload')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                researchInputMode === 'upload'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📄 Upload Research
            </button>
          </div>

          {/* Generate Research Mode */}
          {researchInputMode === 'generate' && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Research Topic
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-200">Mode:</span>
                  <button
                    onClick={() => setUseDeepResearch(!useDeepResearch)}
                    className={`text-xs px-3 py-1 rounded-full transition-all ${
                      useDeepResearch 
                        ? 'bg-white text-indigo-600 font-semibold' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {useDeepResearch ? '🔬 Deep Research' : '⚡ GPT-4o Fast'}
                  </button>
                </div>
              </div>
              <p className="text-sm text-indigo-100 mb-4">
                {useDeepResearch 
                  ? 'Uses o4-mini-deep-research with web search (5-15 min, searches the web)' 
                  : 'Uses GPT-4o without web search (faster, uses training data)'}
              </p>
              <div className="flex gap-3">
                <input
                  key="research-topic-input"
                  id="research-topic-input"
                  type="text"
                  value={researchTopic}
                  onChange={(e) => setResearchTopic(e.target.value)}
                  placeholder="e.g., Change orders and scope creep"
                  className="flex-1 px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white border-0"
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    if (e.key === 'Enter' && !isResearching) startResearch();
                  }}
                  onKeyUp={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onKeyPress={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={startResearch}
                  disabled={isResearching || !researchTopic.trim()}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Researching...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Start Research</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Upload Research Mode */}
          {researchInputMode === 'upload' && (
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white mb-6">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Paste Deep Research Output
              </h4>
              <p className="text-sm text-emerald-100 mb-4">
                Paste the full text from a completed ChatGPT Deep Research session. We'll extract the pain points automatically.
              </p>
              <textarea
                key="upload-research-textarea"
                id="upload-research-textarea"
                value={uploadedResearch}
                onChange={(e) => setUploadedResearch(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onKeyUp={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onKeyPress={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Paste your deep research output here...

Example: Copy the full response from ChatGPT Deep Research including all the pain points, scenarios, and insights it found."
                className="w-full h-48 px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white border-0 resize-none font-mono text-sm"
                autoComplete="off"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-emerald-200">
                  {uploadedResearch.length > 0 ? `${uploadedResearch.length.toLocaleString()} characters` : 'No text pasted yet'}
                </span>
                <button
                  type="button"
                  onClick={processUploadedResearch}
                  disabled={isResearching || !uploadedResearch.trim()}
                  className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      <span>Extract Pain Points</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {researchError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{researchError}</span>
              </div>
            </div>
          )}

          {/* Live Research Output */}
          {(isResearching || researchOutput) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isResearching && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                  <span className="font-medium text-gray-700">{researchStatus}</span>
                </div>
                {researchOutput && !isResearching && (
                  <span className="text-sm text-gray-500">{researchOutput.length} characters</span>
                )}
              </div>
              <div 
                ref={researchOutputRef}
                className="bg-gray-900 rounded-xl p-4 h-80 overflow-y-auto font-mono text-sm text-green-400 whitespace-pre-wrap"
              >
                {researchOutput || 'Waiting for response...'}
                {isResearching && <span className="animate-pulse">▊</span>}
              </div>
            </div>
          )}

          {/* Extracted Pain Points */}
          {extractedPainPoints.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Extracted Pain Points ({extractedPainPoints.length})
                </h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-emerald-700 hover:text-emerald-900 font-medium"
                  >
                    {selectedExtractedIndexes.size === extractedPainPoints.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={savePainPoints}
                    disabled={selectedExtractedIndexes.size === 0}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    Save Selected ({selectedExtractedIndexes.size})
                  </button>
                </div>
              </div>
              <div className="grid gap-3">
                {extractedPainPoints.map((pp, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => togglePainPointSelection(idx)}
                    className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-all ${
                      selectedExtractedIndexes.has(idx)
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-emerald-100 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedExtractedIndexes.has(idx)
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedExtractedIndexes.has(idx) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h5 className="font-semibold text-gray-900">{pp.title}</h5>
                          {pp.emotional_impact_score && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium ml-2">
                              🔥 {pp.emotional_impact_score}/10
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{pp.description}</p>
                        {pp.visceral_trigger && (
                          <p className="text-sm text-emerald-600 mt-2 italic">"{pp.visceral_trigger}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const conceptContent = (
    <div id="concept-section" className="space-y-8">
      {/* Hook Brief Generation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Hook Brief Generation</h3>
              <p className="text-sm text-gray-500">Generate 10 unique video hook concepts</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          {/* Pain Point + Product Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Pain Point</label>
              <div className="relative">
                <select
                  value={selectedPainPoint?.id || ''}
                  onChange={(e) => {
                    const pp = savedPainPoints.find(p => p.id === e.target.value);
                    setSelectedPainPoint(pp || null);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white text-gray-900"
                >
                  <option value="" className="text-gray-500">Choose a pain point...</option>
                  {savedPainPoints.map((pp) => (
                    <option key={pp.id} value={pp.id} className="text-gray-900">
                      {pp.title} (🔥 {pp.emotional_impact_score}/10)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {savedPainPoints.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  ↑ Run deep research first to discover pain points
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Product</label>
              <div className="relative">
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const prod = products.find(p => p.id === e.target.value);
                    setSelectedProduct(prod || null);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white text-gray-900"
                >
                  <option value="" className="text-gray-500">Choose a product...</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id} className="text-gray-900">
                      {prod.name} (${(prod.price_cents / 100).toFixed(0)})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              {products.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  No products found. Add products to the database first.
                </p>
              )}
            </div>
          </div>

          {/* Selected Summary */}
          {selectedPainPoint && selectedProduct && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-6 border border-amber-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-amber-700 uppercase">Pain Point</span>
                  <p className="font-semibold text-gray-900">{selectedPainPoint.title}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-amber-700 uppercase">Product</span>
                  <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateHookBriefs}
            disabled={!selectedPainPoint || !selectedProduct || isGeneratingBriefs}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingBriefs ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating 10 Hook Concepts...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate 10 Hook Briefs</span>
              </>
            )}
          </button>

          {/* Live Brief Generation Output */}
          {(isGeneratingBriefs || briefsOutput) && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                {isGeneratingBriefs && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
                <span className="font-medium text-gray-700">{briefsStatus}</span>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm text-amber-400 whitespace-pre-wrap">
                {briefsOutput || 'Generating...'}
                {isGeneratingBriefs && <span className="animate-pulse">▊</span>}
              </div>
            </div>
          )}

          {/* Generated Briefs Carousel */}
          {editableBriefs.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Hook Briefs ({editableBriefs.length}) 
                  {selectedBriefIndexes.size > 0 && (
                    <span className="text-amber-600 text-sm font-normal">
                      • {selectedBriefIndexes.size} selected
                    </span>
                  )}
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollCarousel('left')}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </button>
                  <button
                    onClick={() => scrollCarousel('right')}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Horizontal Carousel */}
              <div 
                ref={briefsCarouselRef}
                className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-gray-100"
                style={{ scrollbarWidth: 'thin' }}
              >
                {editableBriefs.map((brief, idx) => (
                  <div 
                    key={brief.id || idx}
                    className={`flex-shrink-0 w-96 bg-white rounded-xl border-2 p-5 snap-start transition-all ${
                      selectedBriefIndexes.has(idx)
                        ? 'border-amber-500 ring-2 ring-amber-200 shadow-lg'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    {/* Header with selection checkbox */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleBriefSelection(idx)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                            selectedBriefIndexes.has(idx)
                              ? 'bg-amber-500 border-amber-500'
                              : 'border-gray-300 hover:border-amber-400'
                          }`}
                        >
                          {selectedBriefIndexes.has(idx) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">
                          #{idx + 1}
                        </span>
                      </div>
                      {brief.product_name && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                          {brief.product_name}
                        </span>
                      )}
                    </div>

                    {/* Editable Title */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 font-medium">Title</label>
                      <input
                        type="text"
                        value={brief.title}
                        onChange={(e) => updateBriefField(idx, 'title', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Editable Visual Description */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 font-medium">Visual Description</label>
                      <textarea
                        value={brief.visual_description}
                        onChange={(e) => updateBriefField(idx, 'visual_description', e.target.value)}
                        rows={3}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-white"
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Editable Spoken Hook */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 font-medium">Spoken Hook</label>
                      <input
                        type="text"
                        value={brief.spoken_hook}
                        onChange={(e) => updateBriefField(idx, 'spoken_hook', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-amber-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Editable Text Overlay */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-500 font-medium">Text Overlay</label>
                      <input
                        type="text"
                        value={brief.text_overlay}
                        onChange={(e) => updateBriefField(idx, 'text_overlay', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Editable Copy Super */}
                    <div>
                      <label className="text-xs text-gray-500 font-medium">Copy Super</label>
                      <input
                        type="text"
                        value={brief.copy_super}
                        onChange={(e) => updateBriefField(idx, 'copy_super', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Store Button */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {selectedBriefIndexes.size === 0 
                    ? 'Click the checkboxes to select briefs to store'
                    : `${selectedBriefIndexes.size} brief${selectedBriefIndexes.size > 1 ? 's' : ''} selected`
                  }
                </div>
                <button
                  onClick={storeHookBriefs}
                  disabled={selectedBriefIndexes.size === 0}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  Store Hook Briefs ({selectedBriefIndexes.size})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ad Script Generation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Ad Script Generation</h3>
              <p className="text-sm text-gray-500">Create a 6-section ad script from your saved hook brief</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          {/* Hook Brief Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Select Saved Hook Brief</label>
              <button 
                onClick={loadSavedHookBriefs}
                disabled={isLoadingBriefs}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingBriefs ? 'animate-spin' : ''}`} />
                Refresh Library
              </button>
            </div>
            <div className="relative">
              <select
                value={selectedSavedBrief?.id || ''}
                onChange={(e) => {
                  const brief = savedHookBriefs.find(b => b.id === e.target.value);
                  setSelectedSavedBrief(brief || null);
                  setGeneratedScript(null);
                  setEditableScript(null);
                  setScriptOutput('');
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50 cursor-pointer relative z-10"
                disabled={isLoadingBriefs}
              >
                <option value="" className="text-gray-500">
                  {isLoadingBriefs ? 'Loading hook briefs...' : savedHookBriefs.length === 0 ? 'No saved hook briefs found' : 'Choose a saved hook brief...'}
                </option>
                {savedHookBriefs.map((brief) => (
                  <option key={brief.id} value={brief.id} className="text-gray-900">
                    {brief.title} {brief.batch?.product?.name ? `(${brief.batch.product.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {!isLoadingBriefs && savedHookBriefs.length === 0 && (
              <p className="text-sm text-rose-600 mt-2">
                ↑ Generate and store hook briefs first to create ad scripts
              </p>
            )}
          </div>

          {/* Selected Brief Summary */}
          {selectedSavedBrief && (
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-5 mb-6 border border-rose-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs font-medium text-rose-700 uppercase">Hook Brief</span>
                  <p className="font-semibold text-gray-900">{selectedSavedBrief.title}</p>
                </div>
                {selectedSavedBrief.batch?.product && (
                  <div>
                    <span className="text-xs font-medium text-rose-700 uppercase">Product</span>
                    <p className="font-semibold text-gray-900">
                      {selectedSavedBrief.batch.product.name} (${(selectedSavedBrief.batch.product.price_cents / 100).toLocaleString()})
                    </p>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Spoken Hook:</span> "{selectedSavedBrief.spoken_hook}"
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateAdScript}
            disabled={!selectedSavedBrief || isGeneratingScript}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingScript ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating 6-Section Script...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Generate Ad Script</span>
              </>
            )}
          </button>

          {/* Live Script Generation Output */}
          {(isGeneratingScript || scriptOutput) && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                {isGeneratingScript && <Loader2 className="w-4 h-4 animate-spin text-rose-600" />}
                <span className="font-medium text-gray-700">{scriptStatus}</span>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm text-rose-400 whitespace-pre-wrap">
                {scriptOutput || 'Generating...'}
                {isGeneratingScript && <span className="animate-pulse">▊</span>}
              </div>
            </div>
          )}

          {/* Editable Script Sections */}
          {editableScript && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  6-Section Ad Script
                  {editableScript.estimated_duration_seconds && (
                    <span className="text-sm font-normal text-gray-500">
                      (~{editableScript.estimated_duration_seconds}s)
                    </span>
                  )}
                </h4>
              </div>

              <div className="space-y-4">
                {/* Section 1: Visceral Hook */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">1</span>
                    <label className="text-sm font-semibold text-red-700">Visceral Hook</label>
                    <span className="text-xs text-red-500">(Stop the scroll)</span>
                  </div>
                  <textarea
                    value={editableScript.visceral_hook}
                    onChange={(e) => updateScriptSection('visceral_hook', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none bg-white"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Section 2: Pain Elaboration */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">2</span>
                    <label className="text-sm font-semibold text-orange-700">Pain Elaboration</label>
                    <span className="text-xs text-orange-500">(Twist the knife)</span>
                  </div>
                  <textarea
                    value={editableScript.pain_elaboration}
                    onChange={(e) => updateScriptSection('pain_elaboration', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-white"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Section 3: Solution Intro */}
                <div className="bg-gradient-to-r from-yellow-50 to-lime-50 rounded-xl p-4 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">3</span>
                    <label className="text-sm font-semibold text-yellow-700">Solution Intro</label>
                    <span className="text-xs text-yellow-600">(Bridge to hope)</span>
                  </div>
                  <textarea
                    value={editableScript.solution_intro}
                    onChange={(e) => updateScriptSection('solution_intro', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-yellow-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none bg-white"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Section 4: Product Pitch */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded">4</span>
                    <label className="text-sm font-semibold text-emerald-700">Product Pitch</label>
                    <span className="text-xs text-emerald-500">(The transformation)</span>
                  </div>
                  <textarea
                    value={editableScript.product_pitch}
                    onChange={(e) => updateScriptSection('product_pitch', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Section 5: Price Reveal */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">5</span>
                    <label className="text-sm font-semibold text-blue-700">Price Reveal</label>
                    <span className="text-xs text-blue-500">(Handle objection)</span>
                  </div>
                  <textarea
                    value={editableScript.price_reveal}
                    onChange={(e) => updateScriptSection('price_reveal', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Section 6: CTA */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">6</span>
                    <label className="text-sm font-semibold text-purple-700">Call to Action</label>
                    <span className="text-xs text-purple-500">(Tell them what to do)</span>
                  </div>
                  <textarea
                    value={editableScript.cta}
                    onChange={(e) => updateScriptSection('cta', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-white"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Full Script Preview */}
              <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-700">Full Script Preview</h5>
                  <button
                    onClick={() => {
                      const fullText = [
                        editableScript.visceral_hook,
                        editableScript.pain_elaboration,
                        editableScript.solution_intro,
                        editableScript.product_pitch,
                        editableScript.price_reveal,
                        editableScript.cta
                      ].join('\n\n');
                      navigator.clipboard.writeText(fullText);
                      setScriptStatus('📋 Script copied to clipboard!');
                    }}
                    className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Copy to Clipboard
                  </button>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {[
                    editableScript.visceral_hook,
                    editableScript.pain_elaboration,
                    editableScript.solution_intro,
                    editableScript.product_pitch,
                    editableScript.price_reveal,
                    editableScript.cta
                  ].join('\n\n')}
                </div>
              </div>

              {/* ElevenLabs Audio Generation */}
              <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <Mic className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-amber-900">Generate Voiceover</h5>
                      <p className="text-xs text-amber-700">Create audio narration with ElevenLabs</p>
                    </div>
                  </div>
                  <button
                    onClick={generateScriptAudio}
                    disabled={isGeneratingAudio}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingAudio ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Generate Audio
                      </>
                    )}
                  </button>
                </div>

                {/* Audio Error */}
                {audioError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {audioError}
                    </p>
                  </div>
                )}

                {/* Audio Player & Download */}
                {audioUrl && (
                  <div className="bg-white rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-medium text-gray-700">Audio Generated Successfully!</span>
                    </div>
                    
                    {/* Audio Player */}
                    <audio 
                      controls 
                      className="w-full mb-3"
                      src={audioUrl}
                    >
                      Your browser does not support the audio element.
                    </audio>
                    
                    {/* Download Button */}
                    <a
                      href={audioUrl}
                      download="script_voiceover.mp3"
                      className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      <ArrowRight className="w-4 h-4 rotate-90" />
                      Download MP3
                    </a>
                  </div>
                )}

                {/* Generating Status */}
                {isGeneratingAudio && (
                  <div className="mt-3 p-3 bg-amber-100 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating voiceover with ElevenLabs... This may take 10-30 seconds.
                    </p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {scriptStatus.includes('✅') ? scriptStatus : 'Review and edit the script, then save to database'}
                </div>
                <button
                  onClick={saveAdScript}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Script
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const videoGenContent = (
    <div id="videogen-section" className="space-y-8">
      {/* Sora Video Prompts Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Sora 2 Pro Video Prompts</h3>
                <p className="text-sm text-gray-500">Generate 3 cinematic video prompts (no text overlays)</p>
              </div>
            </div>
            <button
              onClick={generateSoraPrompts}
              disabled={isGeneratingSora || !editableScript}
              className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingSora ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate 3 Sora Prompts</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="p-8">
          {/* Prompt to generate script first */}
          {!editableScript && (
            <div className="text-center py-8 text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Generate an ad script in the Concept tab first to create Sora video prompts</p>
              <button
                onClick={() => setActiveTab('concept')}
                className="mt-4 text-violet-600 hover:text-violet-700 font-medium text-sm"
              >
                Go to Concept Tab →
              </button>
            </div>
          )}

          {/* Sora Generation Output */}
          {(isGeneratingSora || soraOutput) && !editableSoraPrompts && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                {isGeneratingSora && <Loader2 className="w-4 h-4 animate-spin text-violet-600" />}
                <span className="font-medium text-gray-700">{soraStatus}</span>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 h-48 overflow-y-auto font-mono text-sm text-violet-400 whitespace-pre-wrap">
                {soraOutput || 'Generating...'}
                {isGeneratingSora && <span className="animate-pulse">▊</span>}
              </div>
            </div>
          )}

          {/* Editable Sora Prompt Cards */}
          {editableSoraPrompts && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Card 1: Visual Hook */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-5 border border-violet-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-violet-500 text-white text-xs font-bold px-2 py-1 rounded">1</span>
                    <h5 className="font-semibold text-violet-900">Visual Hook</h5>
                    <span className="text-xs text-violet-600 ml-auto">{editableSoraPrompts.visual_hook.duration_seconds}s</span>
                  </div>
                  <p className="text-xs text-violet-600 mb-2">{editableSoraPrompts.visual_hook.purpose}</p>
                  <textarea
                    value={editableSoraPrompts.visual_hook.prompt}
                    onChange={(e) => updateSoraPrompt('visual_hook', 'prompt', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-violet-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none bg-white"
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Visual hook prompt..."
                  />
                  {singleVideoUrls.visual_hook && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
                      ✅ Video ready: <a href={singleVideoUrls.visual_hook} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                    </div>
                  )}
                  <button
                    onClick={() => generateSingleVideo('visual_hook')}
                    disabled={isGeneratingSingleVideo.visual_hook}
                    className="mt-3 w-full bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 text-white text-xs py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isGeneratingSingleVideo.visual_hook ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Generate This Video
                      </>
                    )}
                  </button>
                </div>

                {/* Card 2: Pain/Story */}
                <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-xl p-5 border border-fuchsia-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-fuchsia-500 text-white text-xs font-bold px-2 py-1 rounded">2</span>
                    <h5 className="font-semibold text-fuchsia-900">Pain Story</h5>
                    <span className="text-xs text-fuchsia-600 ml-auto">{editableSoraPrompts.pain_story.duration_seconds}s</span>
                  </div>
                  <p className="text-xs text-fuchsia-600 mb-2">{editableSoraPrompts.pain_story.purpose}</p>
                  <textarea
                    value={editableSoraPrompts.pain_story.prompt}
                    onChange={(e) => updateSoraPrompt('pain_story', 'prompt', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-fuchsia-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none bg-white"
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="Pain story prompt..."
                  />
                  {singleVideoUrls.pain_story && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
                      ✅ Video ready: <a href={singleVideoUrls.pain_story} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                    </div>
                  )}
                  <button
                    onClick={() => generateSingleVideo('pain_story')}
                    disabled={isGeneratingSingleVideo.pain_story}
                    className="mt-3 w-full bg-fuchsia-500 hover:bg-fuchsia-600 disabled:bg-fuchsia-300 text-white text-xs py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isGeneratingSingleVideo.pain_story ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Generate This Video
                      </>
                    )}
                  </button>
                </div>

                {/* Card 3: CTA Closer */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded">3</span>
                    <h5 className="font-semibold text-indigo-900">CTA Closer</h5>
                    <span className="text-xs text-indigo-600 ml-auto">{editableSoraPrompts.cta_closer.duration_seconds}s</span>
                  </div>
                  <p className="text-xs text-indigo-600 mb-2">{editableSoraPrompts.cta_closer.purpose}</p>
                  <textarea
                    value={editableSoraPrompts.cta_closer.prompt}
                    onChange={(e) => updateSoraPrompt('cta_closer', 'prompt', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder="CTA closer prompt..."
                  />
                  {singleVideoUrls.cta_closer && (
                    <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
                      ✅ Video ready: <a href={singleVideoUrls.cta_closer} target="_blank" rel="noopener noreferrer" className="underline">View</a>
                    </div>
                  )}
                  <button
                    onClick={() => generateSingleVideo('cta_closer')}
                    disabled={isGeneratingSingleVideo.cta_closer}
                    className="mt-3 w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-xs py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isGeneratingSingleVideo.cta_closer ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Generate This Video
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> Video #3 (product demo B-roll with pricing) will be auto-generated separately. These Sora prompts are for the hook, story, and CTA videos only.
                </p>
              </div>

              {soraStatus && soraStatus.includes('✅') && (
                <div className="mt-4 text-sm text-emerald-600 font-medium">{soraStatus}</div>
              )}

              {/* Generate Sora Videos Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h5 className="font-semibold text-gray-900">Generate All 3 Videos at Once</h5>
                    <p className="text-sm text-gray-500">Render all 3 videos with Sora 2 in Portrait 720x1280 (12s each)</p>
                  </div>
                  <button
                    onClick={generateSoraVideos}
                    disabled={isGeneratingSoraVideos || !editableSoraPrompts}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingSoraVideos ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating (5-15 min)...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Generate Sora Videos</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Generation in progress warning */}
                {isGeneratingSoraVideos && (
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Videos are being generated and saved to storage...
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Please don&apos;t close this page. This typically takes 5-15 minutes.
                    </p>
                  </div>
                )}

                {/* Video Generation Error */}
                {soraVideoError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {soraVideoError}
                    </p>
                  </div>
                )}

                {/* Video Generation Status */}
                {soraVideoStatus && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Visual Hook Status */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Visual Hook</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getVideoStatusDisplay(soraVideoStatus.visual_hook.status, soraVideoStatus.visual_hook.progress).bg} ${getVideoStatusDisplay(soraVideoStatus.visual_hook.status, soraVideoStatus.visual_hook.progress).color}`}>
                          {getVideoStatusDisplay(soraVideoStatus.visual_hook.status, soraVideoStatus.visual_hook.progress).label}
                        </span>
                      </div>
                      {soraVideoStatus.visual_hook.status === 'in_progress' && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${soraVideoStatus.visual_hook.progress}%` }}
                          />
                        </div>
                      )}
                      {soraVideoStatus.visual_hook.status === 'completed' && soraVideoIds && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500 break-all">ID: {soraVideoIds.visual_hook}</p>
                          <a 
                            href={`https://sora.com/library/${soraVideoIds.visual_hook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on Sora
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Pain Story Status */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Pain Story</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getVideoStatusDisplay(soraVideoStatus.pain_story.status, soraVideoStatus.pain_story.progress).bg} ${getVideoStatusDisplay(soraVideoStatus.pain_story.status, soraVideoStatus.pain_story.progress).color}`}>
                          {getVideoStatusDisplay(soraVideoStatus.pain_story.status, soraVideoStatus.pain_story.progress).label}
                        </span>
                      </div>
                      {soraVideoStatus.pain_story.status === 'in_progress' && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${soraVideoStatus.pain_story.progress}%` }}
                          />
                        </div>
                      )}
                      {soraVideoStatus.pain_story.status === 'completed' && soraVideoIds && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500 break-all">ID: {soraVideoIds.pain_story}</p>
                          <a 
                            href={`https://sora.com/library/${soraVideoIds.pain_story}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on Sora
                          </a>
                        </div>
                      )}
                    </div>

                    {/* CTA Closer Status */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">CTA Closer</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getVideoStatusDisplay(soraVideoStatus.cta_closer.status, soraVideoStatus.cta_closer.progress).bg} ${getVideoStatusDisplay(soraVideoStatus.cta_closer.status, soraVideoStatus.cta_closer.progress).color}`}>
                          {getVideoStatusDisplay(soraVideoStatus.cta_closer.status, soraVideoStatus.cta_closer.progress).label}
                        </span>
                      </div>
                      {soraVideoStatus.cta_closer.status === 'in_progress' && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${soraVideoStatus.cta_closer.progress}%` }}
                          />
                        </div>
                      )}
                      {soraVideoStatus.cta_closer.status === 'completed' && soraVideoIds && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-500 break-all">ID: {soraVideoIds.cta_closer}</p>
                          <a 
                            href={`https://sora.com/library/${soraVideoIds.cta_closer}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View on Sora
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* All Videos Complete Message */}
                {soraVideoStatus && 
                 soraVideoStatus.visual_hook.status === 'completed' &&
                 soraVideoStatus.pain_story.status === 'completed' &&
                 soraVideoStatus.cta_closer.status === 'completed' && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      All 3 Sora videos generated successfully! Ready for the video editing phase.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sora Video Library - Collapsible */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <button
          onClick={() => setIsSoraLibraryExpanded(!isSoraLibraryExpanded)}
          className="w-full px-8 py-6 border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold text-gray-900">Sora Video Library</h3>
                <p className="text-sm text-gray-500">{storedSoraGenerations.length} generated videos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadSoraGenerations();
                }}
                disabled={isLoadingSoraGenerations}
                className="text-violet-600 hover:text-violet-700 font-medium text-sm flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingSoraGenerations ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isSoraLibraryExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>
        {isSoraLibraryExpanded && (
          <div className="p-8">
            {isLoadingSoraGenerations ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-violet-500 mb-2" />
                <p className="text-sm text-gray-500">Loading videos...</p>
              </div>
            ) : storedSoraGenerations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h4 className="text-lg font-semibold text-gray-700 mb-2">No Videos Yet</h4>
                <p className="text-sm">Generate Sora videos from the prompts above to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storedSoraGenerations.map((gen) => (
                  <div
                    key={gen.id}
                    className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Video Preview Area */}
                    <div className="aspect-[9/16] bg-gray-900 flex items-center justify-center relative max-h-80">
                      {gen.raw_url ? (
                        <video 
                          src={gen.raw_url} 
                          controls 
                          className="w-full h-full object-contain"
                          preload="metadata"
                        />
                      ) : gen.processing_status === 'raw' || gen.processing_status === 'completed' ? (
                        <div className="text-center">
                          <Play className="w-12 h-12 text-white/50 mx-auto mb-2" />
                          <p className="text-white/70 text-xs">Video Ready (No URL)</p>
                        </div>
                      ) : gen.processing_status === 'generating' ? (
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-2" />
                          <p className="text-white/70 text-xs">Generating...</p>
                        </div>
                      ) : gen.processing_status === 'failed' ? (
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-red-400 text-xs">Failed</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                          <p className="text-white/70 text-xs">{gen.processing_status}</p>
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        gen.processing_status === 'raw' || gen.processing_status === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : gen.processing_status === 'generating'
                          ? 'bg-blue-500 text-white'
                          : gen.processing_status === 'failed'
                          ? 'bg-red-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}>
                        {gen.processing_status}
                      </div>
                    </div>
                    {/* Video Info */}
                    <div className="p-4">
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{gen.sora_prompt_used}</p>
                      <div className="text-xs mb-2">
                        <span className="text-gray-400">
                          {new Date(gen.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-500 break-all mb-2">
                        ID: {gen.sora_generation_id}
                      </p>
                      {/* View on Sora Link */}
                      <a 
                        href={`https://sora.com/library/${gen.sora_generation_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium mb-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on Sora
                      </a>
                      {/* Download Button */}
                      {(gen.processing_status === 'raw' || gen.processing_status === 'completed') && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/sora-videos/download', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ video_id: gen.sora_generation_id }),
                              });
                              if (res.ok) {
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `sora-${gen.sora_generation_id}.mp4`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }
                            } catch (e) {
                              console.error('Download failed:', e);
                            }
                          }}
                          className="mt-2 w-full bg-violet-500 hover:bg-violet-600 text-white text-sm py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <ArrowRight className="w-4 h-4 rotate-90" />
                          Download MP4
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next Step */}
      <div className="flex justify-end">
        <button
          onClick={() => setActiveTab('video')}
          className="bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 hover:shadow-lg transition-all duration-200 flex items-center space-x-3"
        >
          <span>Proceed to Video Editing</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const videoEditingContent = (
    <div className="space-y-8">
      {/* Saved Drafts Panel */}
      {showDraftsPanel && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📁 Saved Drafts (Treasure Maps)</h3>
            <button
              onClick={() => setShowDraftsPanel(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Select a saved draft to load its asset configuration. Each draft contains all the URLs the AI agent needs.
          </p>
          {savedDrafts.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">No saved drafts yet. Save your first draft below!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedDrafts.map((draft) => (
                <button
                  key={draft.id}
                  onClick={() => loadDraft(draft.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:border-blue-300 hover:bg-blue-50 ${
                    manifestId === draft.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${draft.is_locked ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {draft.draft_name || `Draft ${draft.id.slice(0, 8)}`}
                        {draft.is_locked && <span className="ml-2 text-emerald-600 text-xs">🔒 Locked</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(draft.created_at).toLocaleDateString()} at {new Date(draft.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">Load →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Asset Control Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Configure Video Assets</h3>
                <p className="text-sm text-gray-500">Select which assets to use for your video generation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  loadSavedDrafts();
                  setShowDraftsPanel(!showDraftsPanel);
                }}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50"
              >
                <Layers className="w-4 h-4" />
                {showDraftsPanel ? 'Hide' : 'View'} Saved Drafts
              </button>
              {isManifestLocked && (
                <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  Locked
                </span>
              )}
              <button
                onClick={() => loadAvailableAssets()}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Load Assets
              </button>
            </div>
          </div>
          {manifestStatus && (
            <p className={`mt-2 text-sm ${manifestStatus.includes('✅') ? 'text-emerald-600' : manifestStatus.includes('❌') ? 'text-red-600' : 'text-gray-500'}`}>
              {manifestStatus}
            </p>
          )}
        </div>

        <div className="p-8 space-y-8">
          {!availableAssets ? (
            <div className="text-center py-12 text-gray-500">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h4 className="text-lg font-semibold text-gray-700 mb-2">Load Your Assets</h4>
              <p className="text-sm mb-4">Click &quot;Load Assets&quot; above to load your Sora videos, audio, and media library.</p>
              <button
                onClick={() => loadAvailableAssets()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Load Available Assets
              </button>
            </div>
          ) : (
            <>
              {/* Sora Video Selection */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Video className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Sora Video Clips</h4>
                </div>

                {/* Visual Hook Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visual Hook (0-17s) {manifestSelections.visual_hook && <span className="text-emerald-500">✓</span>}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...(availableAssets.sora_videos.visual_hook || []), ...(availableAssets.sora_videos.uncategorized || [])].map((video) => (
                      <button
                        key={video.id}
                        onClick={() => !isManifestLocked && setManifestSelections(prev => ({ ...prev, visual_hook: video }))}
                        disabled={isManifestLocked}
                        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                          manifestSelections.visual_hook?.id === video.id
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300'
                        } ${isManifestLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <video 
                          src={video.processed_url || video.raw_url || ''} 
                          className="w-full h-full object-cover"
                          muted
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                        />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-xs text-white truncate">{video.sora_prompt_used?.substring(0, 50)}...</p>
                        </div>
                        {manifestSelections.visual_hook?.id === video.id && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Selected
                          </div>
                        )}
                      </button>
                    ))}
                    {availableAssets.sora_videos.visual_hook?.length === 0 && availableAssets.sora_videos.uncategorized?.length === 0 && (
                      <p className="text-sm text-gray-500 italic col-span-3">No videos available - generate Sora videos first</p>
                    )}
                  </div>
                </div>

                {/* Pain Story Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pain Story (17-28s) {manifestSelections.pain_story && <span className="text-emerald-500">✓</span>}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...(availableAssets.sora_videos.pain_story || []), ...(availableAssets.sora_videos.uncategorized || [])].map((video) => (
                      <button
                        key={video.id}
                        onClick={() => !isManifestLocked && setManifestSelections(prev => ({ ...prev, pain_story: video }))}
                        disabled={isManifestLocked}
                        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                          manifestSelections.pain_story?.id === video.id
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300'
                        } ${isManifestLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <video 
                          src={video.processed_url || video.raw_url || ''} 
                          className="w-full h-full object-cover"
                          muted
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                        />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-xs text-white truncate">{video.sora_prompt_used?.substring(0, 50)}...</p>
                        </div>
                        {manifestSelections.pain_story?.id === video.id && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Selected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA Closer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CTA Closer (59-64s) {manifestSelections.cta_closer && <span className="text-emerald-500">✓</span>}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...(availableAssets.sora_videos.cta_closer || []), ...(availableAssets.sora_videos.uncategorized || [])].map((video) => (
                      <button
                        key={video.id}
                        onClick={() => !isManifestLocked && setManifestSelections(prev => ({ ...prev, cta_closer: video }))}
                        disabled={isManifestLocked}
                        className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                          manifestSelections.cta_closer?.id === video.id
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300'
                        } ${isManifestLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <video 
                          src={video.processed_url || video.raw_url || ''} 
                          className="w-full h-full object-cover"
                          muted
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                        />
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-xs text-white truncate">{video.sora_prompt_used?.substring(0, 50)}...</p>
                        </div>
                        {manifestSelections.cta_closer?.id === video.id && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Selected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Audio Selection */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Mic className="w-5 h-5 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Voiceover Audio {availableAssets.voiceover?.audio_url && <span className="text-emerald-500">✓</span>}
                    </h4>
                  </div>
                  {availableAssets.voiceover?.batch_id && (
                    <span className="text-xs text-gray-400">Batch: {availableAssets.voiceover.batch_id.slice(0, 8)}...</span>
                  )}
                </div>

                {availableAssets.voiceover?.audio_url ? (
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <div>
                      <p className="font-medium text-gray-900">ElevenLabs Voiceover</p>
                      <p className="text-sm text-gray-600">Generated from your script</p>
                    </div>
                    <audio controls src={availableAssets.voiceover.audio_url} className="h-10" />
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-sm text-amber-700">
                      <strong>No voiceover found.</strong> Generate audio from your script in the Concept tab first, then click &quot;Load Assets&quot; again.
                    </p>
                  </div>
                )}
              </div>

              {/* Background Music Selection */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Music className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Background Music {manifestSelections.background_music && <span className="text-emerald-500">✓</span>}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-500">
                    {availableAssets.background_music?.length || 0} tracks available
                  </p>
                </div>

                <div className="space-y-3">
                  {availableAssets.background_music?.map((music) => (
                    <button
                      key={music.id}
                      onClick={() => !isManifestLocked && setManifestSelections(prev => ({ ...prev, background_music: music }))}
                      disabled={isManifestLocked}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        manifestSelections.background_music?.id === music.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      } ${isManifestLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          manifestSelections.background_music?.id === music.id 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-300'
                        }`}>
                          {manifestSelections.background_music?.id === music.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{music.asset_name}</p>
                        </div>
                      </div>
                      <audio controls src={music.file_url} className="h-10" onClick={(e) => e.stopPropagation()} />
                    </button>
                  ))}
                  {(!availableAssets.background_music || availableAssets.background_music.length === 0) && (
                    <p className="text-sm text-gray-500 italic">No background music found in media-library/background-music bucket</p>
                  )}
                </div>
              </div>

              {/* Sound Effects Selection */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Sound Effects 
                      {manifestSelections.sound_effects.length > 0 && (
                        <span className="text-emerald-500 ml-1">({manifestSelections.sound_effects.length} selected)</span>
                      )}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-500">Select sound effects to include in your video</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableAssets.sound_effects?.map((sfx) => {
                    const isSelected = manifestSelections.sound_effects.some(s => s.effect_id === sfx.id);
                    return (
                      <button
                        key={sfx.id}
                        onClick={() => {
                          if (isManifestLocked) return;
                          setManifestSelections(prev => ({
                            ...prev,
                            sound_effects: isSelected
                              ? prev.sound_effects.filter(s => s.effect_id !== sfx.id)
                              : [...prev.sound_effects, { effect_id: sfx.id, timing: 0, volume: 0.7, asset: sfx }]
                          }));
                        }}
                        disabled={isManifestLocked}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 hover:border-yellow-300 bg-white'
                        } ${isManifestLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">{sfx.asset_name}</p>
                          </div>
                        </div>
                        <audio 
                          controls 
                          src={sfx.file_url} 
                          className="h-8 w-32" 
                          onClick={(e) => e.stopPropagation()} 
                        />
                      </button>
                    );
                  })}
                  {(!availableAssets.sound_effects || availableAssets.sound_effects.length === 0) && (
                    <p className="text-sm text-gray-500 italic col-span-2">No sound effects found in media-library/sound-effects bucket</p>
                  )}
                </div>
              </div>

              {/* Product Demo Selection */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Film className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      Product Demo (Optional) {manifestSelections.product_demo && <span className="text-emerald-500">✓</span>}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-500">
                    {availableAssets.product_demos?.length || 0} demos available
                  </p>
                </div>

                <div className="space-y-3">
                  {availableAssets.product_demos?.map((demo) => (
                    <button
                      key={demo.id}
                      onClick={() => !isManifestLocked && setManifestSelections(prev => ({ 
                        ...prev, 
                        product_demo: prev.product_demo?.id === demo.id ? null : demo 
                      }))}
                      disabled={isManifestLocked}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        manifestSelections.product_demo?.id === demo.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      } ${isManifestLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          manifestSelections.product_demo?.id === demo.id 
                            ? 'bg-indigo-500 border-indigo-500' 
                            : 'border-gray-300'
                        }`}>
                          {manifestSelections.product_demo?.id === demo.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{demo.asset_name || demo.products?.name || 'Product Demo'}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {(!availableAssets.product_demos || availableAssets.product_demos.length === 0) && (
                    <p className="text-sm text-gray-500 italic">No product demos found in media-library/product-demo-assets bucket</p>
                  )}
                </div>
              </div>

              {/* Create Ad Section */}
              <div className="border-t border-gray-200 pt-8">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-1">
                        {isManifestLocked ? '✅ Manifest Locked' : 'Ready to Generate?'}
                      </h4>
                      <p className="text-sm text-gray-700 font-medium">
                        {isManifestLocked
                          ? 'Your asset configuration is locked. The agent can now generate your video.'
                          : allManifestAssetsSelected
                            ? 'All required assets selected. Lock configuration and proceed to video generation.'
                            : `Select all required assets: Videos (${[manifestSelections.visual_hook, manifestSelections.pain_story, manifestSelections.cta_closer].filter(Boolean).length}/3), Audio ✓, Music (${manifestSelections.background_music ? '1' : '0'}/1)`
                        }
                      </p>
                      {manifestId && (
                        <p className="text-xs text-gray-600 mt-1">Manifest ID: {manifestId}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {!isManifestLocked && (
                        <>
                          <input
                            type="text"
                            placeholder="Name your draft..."
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => saveManifest(false)}
                            disabled={isSavingManifest}
                            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-all"
                          >
                            <Save className="w-4 h-4" />
                            <span>Save Draft</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => isManifestLocked ? setIsManifestLocked(false) : saveManifest(true)}
                        disabled={(!allManifestAssetsSelected && !isManifestLocked) || isSavingManifest}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                          isManifestLocked
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : allManifestAssetsSelected
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isSavingManifest ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                        <span>{isManifestLocked ? 'Unlock to Edit' : 'Create Ad'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Agent Endpoint Info - Show whenever we have a manifest saved */}
                  {manifestId && (
                    <div className="mt-4 p-4 bg-white/80 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🗺️</span>
                        <p className="text-sm font-bold text-gray-800">Treasure Map for AI Agent</p>
                        {isManifestLocked && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Locked & Ready</span>}
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        This endpoint provides all asset URLs the AI agent needs to generate your video:
                      </p>
                      <code className="text-xs bg-gray-900 text-green-400 px-3 py-2 rounded block overflow-x-auto font-mono">
                        GET /api/agent/get-manifest?manifest_id={manifestId}
                      </code>
                      <div className="mt-3 text-xs text-gray-600 space-y-1">
                        <p>✅ Sora video URLs (hook, pain story, CTA)</p>
                        <p>✅ Voiceover audio URL</p>
                        <p>✅ Background music URL</p>
                        <p>✅ Sound effects with timings</p>
                        <p>✅ Product demo URL (if selected)</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/api/agent/get-manifest?manifest_id=${manifestId}`);
                          setManifestStatus('📋 Agent endpoint URL copied to clipboard!');
                        }}
                        className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        📋 Copy Full URL
                      </button>
                    </div>
                  )}

                  {/* Video Generation Section - Show when manifest is locked */}
                  {isManifestLocked && (
                    <div className="mt-4 p-4 bg-white/80 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎬</span>
                          <p className="text-sm font-bold text-gray-800">In-App Video Generation</p>
                          {currentVideoJob?.status === 'complete' && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Complete</span>
                          )}
                        </div>
                        {!currentVideoJob && (
                          <button
                            onClick={startVideoGeneration}
                            disabled={isStartingVideoGeneration}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                          >
                            {isStartingVideoGeneration ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            <span>Generate Video</span>
                          </button>
                        )}
                      </div>

                      {/* Progress Display */}
                      {currentVideoJob && (
                        <div className="space-y-3">
                          {/* Progress Bar */}
                          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                                currentVideoJob.status === 'complete' 
                                  ? 'bg-emerald-500' 
                                  : currentVideoJob.status === 'failed'
                                    ? 'bg-red-500'
                                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                              }`}
                              style={{ width: `${currentVideoJob.progress}%` }}
                            />
                            {currentVideoJob.status !== 'complete' && currentVideoJob.status !== 'failed' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                            )}
                          </div>

                          {/* Status Text */}
                          <div className="flex items-center justify-between text-sm">
                            <span className={`font-medium ${
                              currentVideoJob.status === 'complete' 
                                ? 'text-emerald-600' 
                                : currentVideoJob.status === 'failed'
                                  ? 'text-red-600'
                                  : 'text-gray-700'
                            }`}>
                              {currentVideoJob.current_step}
                            </span>
                            <span className="text-gray-500">{currentVideoJob.progress}%</span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            {currentVideoJob.status === 'downloading' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Downloading Assets
                              </span>
                            )}
                            {currentVideoJob.status === 'processing' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Processing Video
                              </span>
                            )}
                            {currentVideoJob.status === 'encoding' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Encoding
                              </span>
                            )}
                            {currentVideoJob.status === 'uploading' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Uploading
                              </span>
                            )}
                            {currentVideoJob.status === 'complete' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Complete
                              </span>
                            )}
                            {currentVideoJob.status === 'failed' && (
                              <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                <AlertCircle className="w-3 h-3" />
                                Failed
                              </span>
                            )}
                          </div>

                          {/* Final Video */}
                          {currentVideoJob.final_video_url && (
                            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                              <p className="text-sm font-semibold text-emerald-800 mb-2">🎉 Your video is ready!</p>
                              <video 
                                src={currentVideoJob.final_video_url} 
                                controls 
                                className="w-full rounded-lg max-h-64"
                              />
                              <a
                                href={currentVideoJob.final_video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Open in New Tab
                              </a>
                            </div>
                          )}

                          {/* Error Message */}
                          {currentVideoJob.error_message && (
                            <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                              <p className="text-sm text-red-700">{currentVideoJob.error_message}</p>
                              <button
                                onClick={() => setCurrentVideoJob(null)}
                                className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Dismiss & Try Again
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {!currentVideoJob && (
                        <p className="text-xs text-gray-600">
                          Click &quot;Generate Video&quot; to create your final ad using FFmpeg. This combines all your selected assets into a professional 60-70 second video.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const adsContent = (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Generated Ads</h2>
            <p className="text-gray-600">Preview and manage your created video ads</p>
          </div>
          <button
            onClick={loadGeneratedAds}
            disabled={isLoadingAds}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoadingAds ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Refresh</span>
          </button>
        </div>

        {isLoadingAds ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading your ads...</span>
          </div>
        ) : generatedAds.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Video className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Ads Generated Yet</h3>
            <p className="mb-4">Complete the video editing process to see your generated ads here.</p>
            <button
              onClick={() => setActiveTab('video')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Video Editing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedAds.map((ad) => (
              <div
                key={ad.id}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Video Preview */}
                <div className="aspect-[9/16] bg-black relative">
                  {ad.final_video_url ? (
                    <video
                      src={ad.final_video_url}
                      controls
                      className="w-full h-full object-contain"
                      poster=""
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Video className="w-12 h-12" />
                    </div>
                  )}
                </div>
                
                {/* Ad Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 truncate">
                    {ad.draft_name || `Ad ${ad.id.slice(0, 8)}`}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Created {new Date(ad.completed_at || ad.created_at).toLocaleDateString()} at{' '}
                    {new Date(ad.completed_at || ad.created_at).toLocaleTimeString()}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <a
                      href={ad.final_video_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open</span>
                    </a>
                    <button
                      onClick={() => {
                        if (ad.final_video_url) {
                          navigator.clipboard.writeText(ad.final_video_url);
                          setManifestStatus('📋 Video URL copied to clipboard!');
                        }
                      }}
                      className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                      title="Copy URL"
                    >
                      📋
                    </button>
                    <a
                      href={ad.final_video_url || '#'}
                      download={`${ad.draft_name || 'ad'}.mp4`}
                      className="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                      title="Download"
                    >
                      ⬇️
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const metaContent = (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center py-12 text-gray-500">
          <Facebook className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Meta Deployment Coming Soon</h3>
          <p>Complete the video editing phase first to deploy to Meta.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <div className="text-blue-600 font-bold text-xl">🏭</div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">The Slop Factory</h1>
                  <p className="text-blue-200">Automated Ad Generation Pipeline</p>
                </div>
              </div>
              <button className="p-3 text-white/80 hover:text-white transition-colors bg-white/10 rounded-xl hover:bg-white/20">
                <Settings className="w-6 h-6" />
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {activeTab === 'script' && scriptCreationContent}
          {activeTab === 'concept' && conceptContent}
          {activeTab === 'videogen' && videoGenContent}
          {activeTab === 'video' && videoEditingContent}
          {activeTab === 'ads' && adsContent}
          {activeTab === 'meta' && metaContent}
        </div>
      </div>
    </div>
  );
}
