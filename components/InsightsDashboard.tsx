
import React from 'react';
import { DailyInsight, PremiumTier, CoachingMode, InsightTypeTag } from '../types';
import { ResponsiveContainer, AreaChart, Area, Tooltip, CartesianGrid } from 'recharts';
import { Lock, Zap, Activity, Brain, Layers, Eye, TrendingUp, AlertTriangle, ArrowRight, Target, CheckCircle2, GitMerge, FileText, ChevronUp, ChevronDown, Minus, RefreshCw } from 'lucide-react';
import { MODE_CONFIG } from '../constants';

interface Props {
  insights: DailyInsight[];
  tier: PremiumTier;
}

const InsightsDashboard: React.FC<Props> = ({ insights, tier }) => {
  const chartData = insights
    .filter(i => i.sourceMode === CoachingMode.BASELINE || i.sourceMode === CoachingMode.META)
    .map((i, idx) => ({
      name: `Entry ${idx + 1}`,
      emotion: i.emotionalScore,
      energy: i.energyLevel,
      summary: i.summary
    }));

  const metaInsights = insights.filter(i => i.sourceMode === CoachingMode.META);

  // Helper for Type Colors (Module 4)
  const getTypeColor = (type: InsightTypeTag) => {
    switch (type) {
      case 'shadow': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'future': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'meta': return 'text-white bg-white/10 border-white/20';
      case 'conflict': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'emotional': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <ChevronUp size={16} className="text-emerald-400" />;
    if (trend === 'down') return <ChevronDown size={16} className="text-rose-400" />;
    return <Minus size={16} className="text-zinc-500" />;
  };

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-center p-8 animate-in fade-in">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6 relative">
             <Activity className="w-8 h-8 opacity-50 text-emerald-500" />
             <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping" />
        </div>
        <h3 className="text-xl font-light text-white mb-2">Awaiting Telemetry</h3>
        <p className="max-w-md text-sm text-zinc-400 mb-6">
          The Neural Twin is calibrating. Please send a message in the Chat to generate your initial psychological dossier.
        </p>
        <div className="text-xs text-zinc-600 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
           System Status: Listening for signal...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 pb-24 overflow-y-auto h-full scrollbar-hide">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-3xl font-light text-white mb-1">Psychological Dossier</h2>
          <p className="text-zinc-400 text-sm">Advanced Pattern Recognition & Conflict Analysis.</p>
        </div>
        <div className="text-right">
           <div className="text-2xl font-mono text-emerald-400">{insights.length}</div>
           <div className="text-xs text-zinc-500 uppercase tracking-widest">Reports</div>
        </div>
      </div>

      {/* Meta-Insight Card (Module 3 & 4) */}
      {metaInsights.length > 0 && (
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-8 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-white/10 rounded-lg text-white"><Layers size={20} /></div>
            <span className="text-sm font-bold uppercase tracking-widest text-white">Meta-Synthesis v2.0</span>
            <div className="ml-auto flex gap-2">
              <span className={`text-xs px-2 py-1 rounded border ${getTypeColor('meta')}`}>System Wide</span>
            </div>
          </div>
          
          <div className="relative z-10 space-y-6">
            <div>
              <h3 className="text-2xl font-light text-white mb-2">{metaInsights[metaInsights.length - 1].title || "System Synthesis"}</h3>
              <p className="text-lg text-zinc-300 leading-relaxed font-light">
                {metaInsights[metaInsights.length - 1].summary}
              </p>
            </div>
            
            {/* Conflict Detector Output (Module 3) */}
            {metaInsights[metaInsights.length - 1].crossModelConflicts && metaInsights[metaInsights.length - 1].crossModelConflicts!.length > 0 && (
              <div className="bg-orange-950/20 border border-orange-500/20 p-4 rounded-xl">
                 <div className="flex items-center gap-2 mb-3 text-orange-400">
                    <GitMerge size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Active Psychological Conflict Detected</span>
                 </div>
                 {metaInsights[metaInsights.length - 1].crossModelConflicts!.map((conflict, i) => (
                   <div key={i} className="mb-2 last:mb-0">
                     <div className="text-sm font-medium text-orange-200">{conflict.label}</div>
                     <p className="text-xs text-orange-300/70">{conflict.description}</p>
                     <p className="text-xs text-orange-400 mt-1 flex gap-1"><ArrowRight size={12}/> Resolution: {conflict.resolution}</p>
                   </div>
                 ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 h-full">
                    <div className="text-xs text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2"><CheckCircle2 size={12} /> Key Agreements</div>
                    <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                      {metaInsights[metaInsights.length - 1].agreements?.map((a, i) => (
                        <li key={i} className="opacity-80">{a}</li>
                      )) || <span className="text-zinc-500 italic">No convergence detected.</span>}
                    </ul>
                  </div>
               </div>

               <div className="space-y-4">
                  {metaInsights[metaInsights.length - 1].rootCause && (
                    <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                      <div className="text-xs text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Target size={12} /> Root Driver</div>
                      <p className="text-sm text-indigo-200">{metaInsights[metaInsights.length - 1].rootCause}</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm">
               <span className="text-zinc-500 flex items-center gap-2">Memory Weight: {metaInsights[metaInsights.length - 1].memoryStrength || 100}%</span>
               <span className="text-emerald-400 font-medium">Directive: {metaInsights[metaInsights.length - 1].actionableStep}</span>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Chart */}
      <div className="bg-aura-card p-6 rounded-2xl border border-zinc-800">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xs uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Activity size={14} /> Emotional Resilience Trajectory</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorEmotion" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="emotion" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEmotion)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Premium Insight Feed (Module 4) */}
      <div className="space-y-6">
        <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-4 sticky top-0 bg-aura-black py-4 z-10 border-b border-zinc-900">Intelligence Stream</h3>
        
        {insights.slice().reverse().filter(i => i.sourceMode !== CoachingMode.META).map((insight, i) => {
          const modeConfig = MODE_CONFIG[insight.sourceMode];
          const typeStyle = getTypeColor(insight.insightType);

          return (
            <div key={i} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors group">
              
              {/* Premium Header */}
              <div className="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-start">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                      <div className={`w-2 h-2 rounded-full ${modeConfig.color.replace('text-', 'bg-')}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${modeConfig.color}`}>{modeConfig.name}</span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-xs text-zinc-500 font-mono">{new Date(insight.date).toLocaleDateString()}</span>
                   </div>
                   <h4 className="text-lg font-medium text-white group-hover:text-indigo-200 transition-colors">{insight.title}</h4>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest ${typeStyle}`}>
                     {insight.insightType}
                   </div>
                   <div className="flex items-center gap-1 text-zinc-500 text-xs" title="Trend">
                      {getTrendIcon(insight.trend)}
                   </div>
                </div>
              </div>

              {/* Premium Body */}
              <div className="p-6 space-y-6">
                
                {/* Summary */}
                <p className="text-zinc-300 leading-relaxed text-sm border-l-2 border-zinc-800 pl-4">{insight.summary}</p>

                {/* Bullets (Module 4) */}
                {insight.bullets && insight.bullets.length > 0 && (
                  <div className="bg-black/20 p-4 rounded-lg">
                     <ul className="space-y-2">
                       {insight.bullets.map((b, idx) => (
                         <li key={idx} className="text-sm text-zinc-400 flex items-start gap-2">
                           <div className="w-1 h-1 bg-zinc-500 rounded-full mt-2 flex-shrink-0" />
                           {b}
                         </li>
                       ))}
                     </ul>
                  </div>
                )}

                {/* Tags & Action */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800/50">
                   <div className="flex flex-wrap gap-2">
                      {insight.tags?.map((t, idx) => (
                        <span key={idx} className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">#{t}</span>
                      ))}
                   </div>
                   <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500 text-xs uppercase tracking-wide">Next Step:</span>
                      <span className="text-emerald-400 font-medium">{insight.actionableStep}</span>
                   </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightsDashboard;
