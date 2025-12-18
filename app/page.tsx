'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Video, Settings, RefreshCw, CheckCircle, Clock, AlertCircle, Mic, FileText, Wand2, Facebook, DollarSign, Zap, ArrowRight, Brain, Layers, Activity, Search, ThumbsUp, Loader2, X, ImageIcon, Sparkles, ChevronDown, Save, ExternalLink } from 'lucide-react';

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

  // Sora Prompts state
  const [isGeneratingSora, setIsGeneratingSora] = useState(false);
  const [soraOutput, setSoraOutput] = useState('');
  const [soraPrompts, setSoraPrompts] = useState<SoraPrompts | null>(null);
  const [editableSoraPrompts, setEditableSoraPrompts] = useState<SoraPrompts | null>(null);
  const [soraStatus, setSoraStatus] = useState('');

  // Sora Video Generation state
  const [isGeneratingSoraVideos, setIsGeneratingSoraVideos] = useState(false);
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
    created_at: string;
    completed_at: string | null;
    last_error: string | null;
  }
  const [storedSoraGenerations, setStoredSoraGenerations] = useState<SoraGeneration[]>([]);
  const [isLoadingSoraGenerations, setIsLoadingSoraGenerations] = useState(false);

  const tabs = [
    { id: 'script', name: 'Script Creation', icon: FileText },
    { id: 'video', name: 'Video Editing', icon: Video },
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
    if (activeTab === 'script') {
      loadSavedHookBriefs();
    }
    if (activeTab === 'video') {
      loadSoraGenerations();
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

  // Generate Sora Videos
  const generateSoraVideos = async () => {
    if (!editableSoraPrompts) return;

    setIsGeneratingSoraVideos(true);
    setSoraVideoError(null);
    setSoraVideoStatus(null);

    try {
      // Start video generation
      const response = await fetch('/api/sora-videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: editableSoraPrompts }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start video generation');
      }

      // Store video IDs
      setSoraVideoIds({
        visual_hook: data.videos.visual_hook.id,
        pain_story: data.videos.pain_story.id,
        cta_closer: data.videos.cta_closer.id,
      });

      // Set initial status
      setSoraVideoStatus({
        visual_hook: { status: data.videos.visual_hook.status, progress: data.videos.visual_hook.progress },
        pain_story: { status: data.videos.pain_story.status, progress: data.videos.pain_story.progress },
        cta_closer: { status: data.videos.cta_closer.status, progress: data.videos.cta_closer.progress },
      });

      // Start polling for status
      pollVideoStatus({
        visual_hook: data.videos.visual_hook.id,
        pain_story: data.videos.pain_story.id,
        cta_closer: data.videos.cta_closer.id,
      });

    } catch (error) {
      console.error('Failed to generate Sora videos:', error);
      setSoraVideoError(error instanceof Error ? error.message : 'Failed to generate videos');
      setIsGeneratingSoraVideos(false);
    }
  };

  // Poll video status
  const pollVideoStatus = async (videoIds: { visual_hook: string; pain_story: string; cta_closer: string }) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/sora-videos/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_ids: videoIds }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check video status');
        }

        setSoraVideoStatus({
          visual_hook: { status: data.videos.visual_hook.status, progress: data.videos.visual_hook.progress },
          pain_story: { status: data.videos.pain_story.status, progress: data.videos.pain_story.progress },
          cta_closer: { status: data.videos.cta_closer.status, progress: data.videos.cta_closer.progress },
        });

        // Check if all videos are done (completed or failed)
        const allDone = ['completed', 'failed'].includes(data.videos.visual_hook.status) &&
                       ['completed', 'failed'].includes(data.videos.pain_story.status) &&
                       ['completed', 'failed'].includes(data.videos.cta_closer.status);

        if (allDone) {
          clearInterval(pollInterval);
          setIsGeneratingSoraVideos(false);
        }

      } catch (error) {
        console.error('Error polling video status:', error);
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
    <div className="space-y-8">
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

      {/* Sora Video Prompts Section - Standalone Card */}
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
              <p className="text-sm">Generate an ad script first to create Sora video prompts</p>
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
                    <h5 className="font-semibold text-gray-900">Generate Videos with Sora 2</h5>
                    <p className="text-sm text-gray-500">Start rendering all 3 videos (~5-10 min each)</p>
                  </div>
                  <button
                    onClick={generateSoraVideos}
                    disabled={isGeneratingSoraVideos}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingSoraVideos ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generating Videos...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        <span>Generate Sora Videos</span>
                      </>
                    )}
                  </button>
                </div>

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
      {/* Sora Generations Library */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Sora Video Library</h3>
                <p className="text-sm text-gray-500">{storedSoraGenerations.length} generated videos</p>
              </div>
            </div>
            <button
              onClick={loadSoraGenerations}
              disabled={isLoadingSoraGenerations}
              className="text-violet-600 hover:text-violet-700 font-medium text-sm flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingSoraGenerations ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
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
              <p className="text-sm">Generate Sora videos from the Script Creation tab to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storedSoraGenerations.map((gen) => (
                <div
                  key={gen.id}
                  className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Video Preview Area */}
                  <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                    {gen.processing_status === 'raw' || gen.processing_status === 'completed' ? (
                      <div className="text-center">
                        <Play className="w-12 h-12 text-white/50 mx-auto mb-2" />
                        <p className="text-white/70 text-xs">Video Ready</p>
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
      </div>

      {/* Video Editing Tools Coming Soon */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center py-8 text-gray-500">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Video Editing Tools Coming Soon</h3>
          <p className="text-sm">Combine videos, add captions, B-roll, and audio in the next phase.</p>
        </div>
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
          {activeTab === 'video' && videoEditingContent}
          {activeTab === 'meta' && metaContent}
        </div>
      </div>
    </div>
  );
}
