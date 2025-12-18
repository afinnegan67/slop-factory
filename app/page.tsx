'use client';

import { useState, useEffect } from 'react';
import { Play, Sparkles, Video, Upload, Settings, RefreshCw, CheckCircle, Clock, AlertCircle, Mic, FileText, Wand2, Facebook, DollarSign, Zap, ArrowRight, Brain, Layers, Activity, Search, Eye, ThumbsUp, Loader2, X, ImageIcon } from 'lucide-react';

// Types
interface PainAngle {
  id: string;
  title: string;
  description: string;
  visceral_phrase: string | null;
  category: string | null;
  intensity_score: number | null;
  is_approved: boolean;
  times_used: number;
}

interface VisualHook {
  id: string;
  pain_angle_id: string;
  scene_description: string;
  scene_setting: string;
  scene_mood: string;
  headline_text: string;
  subheadline_text: string;
  cta_text: string;
  spoken_script: string;
  voice_tone: string;
  status: string;
}

export default function SlopFactoryDashboard() {
  const [activeTab, setActiveTab] = useState('script');
  
  // Research state
  const [researchTopic, setResearchTopic] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [painAngles, setPainAngles] = useState<PainAngle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<PainAngle | null>(null);
  
  // Visual hook state
  const [isGeneratingHook, setIsGeneratingHook] = useState(false);
  const [generatedHook, setGeneratedHook] = useState<VisualHook | null>(null);
  const [showHookModal, setShowHookModal] = useState(false);

  const tabs = [
    { id: 'script', name: 'Script Creation', icon: FileText },
    { id: 'video', name: 'Video Editing', icon: Video },
    { id: 'meta', name: 'Meta', icon: Facebook }
  ];

  // Start deep research
  const startResearch = async () => {
    if (!researchTopic.trim()) return;
    
    setIsResearching(true);
    try {
      const response = await fetch('/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: researchTopic,
          targetAudience: 'residential contractors',
          researchDepth: 'comprehensive'
        })
      });
      
      const data = await response.json();
      if (data.pain_angles) {
        setPainAngles(data.pain_angles);
      }
    } catch (error) {
      console.error('Research failed:', error);
    } finally {
      setIsResearching(false);
    }
  };

  // Generate visual hook for a pain angle
  const generateVisualHook = async (painAngle: PainAngle) => {
    setSelectedAngle(painAngle);
    setIsGeneratingHook(true);
    setShowHookModal(true);
    
    try {
      const response = await fetch('/api/hooks/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pain_angle_id: painAngle.id })
      });
      
      const data = await response.json();
      if (data.visual_hook) {
        setGeneratedHook(data.visual_hook);
      }
    } catch (error) {
      console.error('Hook generation failed:', error);
    } finally {
      setIsGeneratingHook(false);
    }
  };

  // Approve a pain angle
  const approvePainAngle = async (id: string) => {
    try {
      await fetch('/api/research/angles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_approved: true })
      });
      
      setPainAngles(prev => prev.map(a => 
        a.id === id ? { ...a, is_approved: true } : a
      ));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      financial: 'bg-green-100 text-green-700',
      time: 'bg-blue-100 text-blue-700',
      family: 'bg-pink-100 text-pink-700',
      stress: 'bg-orange-100 text-orange-700',
      reputation: 'bg-purple-100 text-purple-700'
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-700';
  };

  const ScriptCreationTab = () => (
    <div className="space-y-8">
      {/* Pain Research Section - NEW */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Pain Point Research</h3>
              <p className="text-sm text-gray-500">AI-powered deep research to uncover visceral contractor pain angles</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          {/* Research Input */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white mb-6">
            <h4 className="font-semibold mb-2">🔬 Deep Research Mode</h4>
            <p className="text-sm text-blue-100 mb-4">Enter a topic and ChatGPT will conduct comprehensive research, then extract the most visceral pain angles.</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={researchTopic}
                onChange={(e) => setResearchTopic(e.target.value)}
                placeholder="e.g., Change orders and scope creep frustrations"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                onKeyDown={(e) => e.key === 'Enter' && startResearch()}
              />
              <button
                onClick={startResearch}
                disabled={isResearching || !researchTopic.trim()}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Researching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Start Research</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Research Progress */}
          {isResearching && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/30 rounded-2xl p-6 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                <span className="font-semibold text-gray-900">Deep Research in Progress...</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>✓ Analyzing contractor frustrations...</p>
                <p>✓ Identifying emotional triggers...</p>
                <p className="text-indigo-600">→ Extracting visceral pain angles...</p>
              </div>
            </div>
          )}

          {/* Pain Angles Grid */}
          {painAngles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>Discovered Pain Angles ({painAngles.length})</span>
                </h4>
                <span className="text-sm text-gray-500">Click to generate visual hooks</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {painAngles.map((angle) => (
                  <div
                    key={angle.id}
                    className={`p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                      angle.is_approved 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-900">{angle.title}</h5>
                          {angle.intensity_score && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                              🔥 {angle.intensity_score}/10
                            </span>
                          )}
                        </div>
                        {angle.visceral_phrase && (
                          <p className="text-indigo-600 font-medium text-sm mb-2">"{angle.visceral_phrase}"</p>
                        )}
                        <p className="text-sm text-gray-600">{angle.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {angle.category && (
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(angle.category)}`}>
                            {angle.category}
                          </span>
                        )}
                        {angle.is_approved && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!angle.is_approved && (
                          <button
                            onClick={(e) => { e.stopPropagation(); approvePainAngle(angle.id); }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => generateVisualHook(angle)}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                        >
                          <ImageIcon className="w-3 h-3" />
                          Generate Hook
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isResearching && painAngles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Enter a research topic above to discover pain angles</p>
              <p className="text-sm mt-1">Example: "Scheduling conflicts and crew management"</p>
            </div>
          )}
        </div>
      </div>

      {/* Script Generation Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Script Generation</h3>
              <p className="text-sm text-gray-500">Create compelling ad scripts with pain → solution flow</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Product</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                <option>Change Order Shield</option>
                <option>Site Reporter Pro</option>
                <option>Schedule Builder AI</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Script Length</label>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                <option>30 seconds</option>
                <option>45 seconds</option>
                <option>60 seconds</option>
              </select>
            </div>
          </div>
          
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Pain Points {painAngles.filter(a => a.is_approved).length > 0 && `(${painAngles.filter(a => a.is_approved).length} approved)`}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(painAngles.filter(a => a.is_approved).length > 0 
                ? painAngles.filter(a => a.is_approved) 
                : [
                    { id: '1', title: 'Working for free', visceral_phrase: 'Handshake = $10k loss' },
                    { id: '2', title: 'Late night paperwork', visceral_phrase: 'Dining table = office' },
                    { id: '3', title: 'Missing family events', visceral_phrase: 'Another missed game' },
                    { id: '4', title: 'Client interrogation calls', visceral_phrase: 'Where are you?!' }
                  ]
              ).map((pain) => (
                <label key={pain.id} className="flex items-center space-x-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <input type="checkbox" className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-700 block">{pain.title}</span>
                    {pain.visceral_phrase && (
                      <span className="text-xs text-indigo-600">"{pain.visceral_phrase}"</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2">
            <Wand2 className="w-5 h-5" />
            <span>Generate Script Batch</span>
          </button>
        </div>
      </div>

      {/* Sora Video Generation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Sora Video Generation</h3>
              <p className="text-sm text-gray-500">Convert scripts into visual pain scenarios</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Generation Queue</span>
              <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full">12 videos pending</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500" style={{ width: '35%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Estimated time: 24 minutes</p>
          </div>
          
          <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2">
            <Play className="w-5 h-5" />
            <span>Start Sora Generation</span>
          </button>
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

      {/* Visual Hook Modal */}
      {showHookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Visual Hook Generator</h3>
                <p className="text-sm text-gray-500">{selectedAngle?.title}</p>
              </div>
              <button
                onClick={() => { setShowHookModal(false); setGeneratedHook(null); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {isGeneratingHook ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Generating visual hook...</p>
                  <p className="text-sm text-gray-400 mt-1">Creating scene, copy, and script</p>
                </div>
              ) : generatedHook ? (
                <div className="space-y-6">
                  {/* Scene Description */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-600" />
                      Scene Description (for Sora)
                    </h4>
                    <p className="text-gray-700">{generatedHook.scene_description}</p>
                    <div className="flex gap-2 mt-3">
                      <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600">
                        📍 {generatedHook.scene_setting}
                      </span>
                      <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600">
                        😔 {generatedHook.scene_mood}
                      </span>
                    </div>
                  </div>

                  {/* On-Screen Text */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      On-Screen Text Copy
                    </h4>
                    <div className="space-y-2">
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-xs text-gray-400 block mb-1">HEADLINE</span>
                        <p className="text-2xl font-bold text-gray-900">{generatedHook.headline_text}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-xs text-gray-400 block mb-1">SUBHEADLINE</span>
                        <p className="text-lg text-gray-700">{generatedHook.subheadline_text}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <span className="text-xs text-gray-400 block mb-1">CTA</span>
                        <p className="text-blue-600 font-medium">{generatedHook.cta_text}</p>
                      </div>
                    </div>
                  </div>

                  {/* Spoken Script */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Mic className="w-4 h-4 text-green-600" />
                      Spoken Script (for ElevenLabs)
                    </h4>
                    <p className="text-gray-700 italic">"{generatedHook.spoken_script}"</p>
                    <span className="text-xs text-gray-500 mt-2 block">
                      Voice tone: {generatedHook.voice_tone}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                      Save Hook
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const VideoEditingTab = () => (
    <div className="space-y-8">
      {/* Video Processing Pipeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Video Processing Pipeline</h3>
              <p className="text-sm text-gray-500">Enhance and brand your Sora videos</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Watermark Removal</h4>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-4">Remove Sora watermarks</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">12/12</span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Complete</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">AI Upscaling</h4>
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-sm text-gray-600 mb-4">Higgsfield AI enhancement</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">8/12</span>
                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Processing</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Quality Check</h4>
                <AlertCircle className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">Verify video quality</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">0/12</span>
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">Pending</span>
              </div>
            </div>
          </div>
          
          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5" />
            <span>Process All Videos</span>
          </button>
        </div>
      </div>

      {/* Automated Editing */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Automated Editing Suite</h3>
              <p className="text-sm text-gray-500">Apply branding, captions, and effects</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[
              { icon: FileText, color: 'yellow', title: 'Avatar Callout', desc: 'RESIDENTIAL CONTRACTORS overlay' },
              { icon: Mic, color: 'blue', title: 'ElevenLabs Voiceover', desc: 'AI voice narration sync' },
              { icon: DollarSign, color: 'green', title: 'Pricing & Guarantees', desc: '$2,500, lifetime access' },
              { icon: Zap, color: 'purple', title: 'Sound Effects', desc: 'Whooshes, shutters, music' }
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-4 p-5 bg-gray-50 rounded-2xl hover:shadow-md transition-all duration-200">
                <div className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded-lg text-blue-600" defaultChecked />
              </div>
            ))}
          </div>
          
          <button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2">
            <Wand2 className="w-5 h-5" />
            <span>Apply All Edits</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button 
          onClick={() => setActiveTab('script')}
          className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center space-x-3"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
          <span>Back to Scripts</span>
        </button>
        <button 
          onClick={() => setActiveTab('meta')}
          className="bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 hover:shadow-lg transition-all duration-200 flex items-center space-x-3"
        >
          <span>Deploy to Meta</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const MetaTab = () => (
    <div className="space-y-8">
      {/* Campaign Deployment */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Campaign Deployment</h3>
              <p className="text-sm text-gray-500">Push ads to Facebook and track performance</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Campaign</label>
            <select className="w-full lg:w-1/2 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option>Testing Campaign (New Creatives)</option>
              <option>Main Campaign (Proven Winners)</option>
              <option>Scale Campaign (Top Performers)</option>
            </select>
          </div>
          
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Ad Sets Configuration</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Working for Free', ads: 3, status: 'ready' },
                { name: 'Late Night Work', ads: 3, status: 'ready' },
                { name: 'Missing Events', ads: 3, status: 'ready' },
                { name: 'Client Calls', ads: 3, status: 'processing' },
                { name: 'Scope Creep', ads: 2, status: 'pending' }
              ].map((adSet, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{adSet.name}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      adSet.status === 'ready' ? 'bg-green-500' :
                      adSet.status === 'processing' ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}></span>
                  </div>
                  <p className="text-sm text-gray-500">{adSet.ads} ads {adSet.status}</p>
                </div>
              ))}
            </div>
          </div>
          
          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Deploy to Facebook</span>
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">Performance Metrics</h3>
            <p className="text-sm text-gray-500">Real-time creative performance</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'ROAS', value: '4.2x', change: '+12%', positive: true },
                { label: 'CTR', value: '2.8%', change: '+0.4%', positive: true },
                { label: 'CPC', value: '$1.24', change: '-8%', positive: true },
                { label: 'Conv Cost', value: '$42', change: '-15%', positive: true }
              ].map((metric, index) => (
                <div key={index}>
                  <p className="text-sm font-medium text-gray-500 mb-1">{metric.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                  <p className={`text-sm font-medium ${metric.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change} vs last week
                  </p>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Top Performers</h4>
              <div className="space-y-3">
                {[
                  { name: '"Handshake = $10k" - Change Order', roas: '6.8x', ctr: '3.2%', status: 'winner' },
                  { name: '"Late Night Paperwork" - Site Reporter', roas: '3.9x', ctr: '2.4%', status: 'testing' }
                ].map((ad, index) => (
                  <div key={index} className={`p-4 rounded-xl ${
                    ad.status === 'winner' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{ad.name}</p>
                        <p className="text-sm text-gray-600">ROAS: {ad.roas} | CTR: {ad.ctr}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        ad.status === 'winner' ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                      }`}>
                        {ad.status === 'winner' ? 'Winner' : 'Testing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">AI Insights</h3>
              <p className="text-sm text-purple-100">Voice-enabled optimization</p>
            </div>
          </div>
          <p className="text-purple-100 mb-6">Analyze winning pain angles and get real-time creative suggestions</p>
          <button className="w-full bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2">
            <Mic className="w-5 h-5" />
            <span>Talk to AI</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-start">
        <button 
          onClick={() => setActiveTab('video')}
          className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center space-x-3"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
          <span>Back to Video Editing</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-blue-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <div className="text-blue-600 font-bold text-xl">OAI</div>
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
            
            {/* Modern Tab Navigation */}
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
        {activeTab === 'script' && <ScriptCreationTab />}
        {activeTab === 'video' && <VideoEditingTab />}
        {activeTab === 'meta' && <MetaTab />}
      </div>
    </div>
  );
}
