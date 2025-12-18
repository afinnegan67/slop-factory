'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Video, Settings, RefreshCw, CheckCircle, Clock, AlertCircle, Mic, FileText, Wand2, Facebook, DollarSign, Zap, ArrowRight, Brain, Layers, Activity, Search, ThumbsUp, Loader2, X, ImageIcon, Sparkles, ChevronDown, Save } from 'lucide-react';

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

  const tabs = [
    { id: 'script', name: 'Script Creation', icon: FileText },
    { id: 'video', name: 'Video Editing', icon: Video },
    { id: 'meta', name: 'Meta', icon: Facebook }
  ];

  // Load products and saved pain points on mount
  useEffect(() => {
    loadProducts();
    loadPainPoints();
  }, []);

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
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
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
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-amber-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center py-12 text-gray-500">
          <Video className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Video Editing Coming Soon</h3>
          <p>Complete the script creation phase first to unlock video editing.</p>
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
