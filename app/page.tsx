'use client';

import { useState } from 'react';
import { Play, Sparkles, Video, Upload, TrendingUp, BarChart3, Settings, RefreshCw, CheckCircle, Clock, AlertCircle, ChevronRight, Mic, FileText, Wand2, Facebook, DollarSign, Target, Zap, ArrowRight, Brain, Layers, Activity } from 'lucide-react';

export default function SlopFactoryDashboard() {
  const [activeTab, setActiveTab] = useState('script');

  const tabs = [
    { id: 'script', name: 'Script Creation', icon: FileText },
    { id: 'video', name: 'Video Editing', icon: Video },
    { id: 'meta', name: 'Meta', icon: Facebook }
  ];

  const ScriptCreationTab = () => (
    <div className="space-y-8">
      {/* Pain Research Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Pain Point Research</h3>
              <p className="text-sm text-gray-500">Generate visceral contractor pain angles</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Active Pain Points</span>
              </h4>
              <div className="space-y-3">
                {[
                  'Working for free (handshake = $10k loss)',
                  'Late night paperwork at dining table',
                  'Missing family events',
                  'Client interrogation calls on the road'
                ].map((pain, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-xl shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <span className="text-sm text-gray-700 flex-1">{pain}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
              <h4 className="font-semibold mb-4">Research New Angles</h4>
              <p className="text-sm text-blue-100 mb-6">AI-powered research will find fresh pain points that resonate with contractors</p>
              <button className="w-full bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Generate 5 New Pain Points</span>
              </button>
            </div>
          </div>
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
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Pain Points</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['Working for free', 'Late night paperwork', 'Missing family events', 'Client interrogation calls'].map((pain, index) => (
                <label key={index} className="flex items-center space-x-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <input type="checkbox" className="w-5 h-5 rounded-lg text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">{pain}</span>
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
      {/* Modern Header with Blue to White Gradient */}
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
                  <p className="text-blue-100">Automated Ad Generation Pipeline</p>
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

