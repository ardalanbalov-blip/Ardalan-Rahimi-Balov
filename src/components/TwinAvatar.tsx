
import React from 'react';
import { TwinState, CoachingMode } from '../types';

interface Props {
  state: TwinState;
  mode: CoachingMode;
}

const TwinAvatar: React.FC<Props> = ({ state, mode }) => {
  // Determine colors based on Mode
  const getModeColors = () => {
    switch (mode) {
      case CoachingMode.SHADOW:
        return { core: '#ef4444', glow: '#b91c1c', accent: '#7f1d1d' }; // Red
      case CoachingMode.FUTURE:
        return { core: '#f59e0b', glow: '#d97706', accent: '#fef3c7' }; // Gold
      case CoachingMode.ADAPTIVE:
        return { core: '#06b6d4', glow: '#0891b2', accent: '#22d3ee' }; // Cyan
      case CoachingMode.PATTERN:
        return { core: '#8b5cf6', glow: '#7c3aed', accent: '#a78bfa' }; // Violet
      case CoachingMode.META:
        return { core: '#ffffff', glow: '#e4e4e7', accent: '#d4d4d8' }; // White/Prismatic
      default: // BASELINE
        return { core: '#10b981', glow: '#059669', accent: '#34d399' }; // Emerald
    }
  };

  const colors = getModeColors();
  
  const animationDuration = mode === CoachingMode.ADAPTIVE || mode === CoachingMode.META
    ? '4s'
    : `${3 - (state.energy / 50)}s`; 

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse-slow"
        style={{ backgroundColor: colors.glow }}
      />

      {/* Core Shape */}
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full animate-breathe" style={{ animationDuration }}>
          <defs>
            <radialGradient id={`grad-${mode}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" style={{ stopColor: colors.accent, stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: colors.core, stopOpacity: 0.1 }} />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          <circle cx="100" cy="100" r="80" fill={`url(#grad-${mode})`} filter="url(#glow)" />
          
          {/* Inner details */}
          <circle 
            cx="100" 
            cy="100" 
            r={state.coherence / 2} 
            fill="none" 
            stroke={colors.core} 
            strokeWidth="2"
            className="opacity-60"
          />
          
          {/* Mode Specific Visuals */}
          {mode === CoachingMode.ADAPTIVE && (
            <circle 
              cx="100" 
              cy="100" 
              r="70" 
              fill="none" 
              stroke={colors.core} 
              strokeWidth="0.5"
              strokeDasharray="4 4"
              className="animate-spin opacity-30" 
              style={{ animationDuration: '8s' }}
            />
          )}

          {mode === CoachingMode.PATTERN && (
            <g className="opacity-40">
               <line x1="60" y1="100" x2="140" y2="100" stroke={colors.accent} strokeWidth="1" />
               <line x1="100" y1="60" x2="100" y2="140" stroke={colors.accent} strokeWidth="1" />
               <circle cx="100" cy="100" r="40" fill="none" stroke={colors.accent} strokeDasharray="2 4" />
            </g>
          )}

          {mode === CoachingMode.META && (
            <g className="opacity-50 animate-spin" style={{ animationDuration: '20s' }}>
              <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke={colors.core} strokeWidth="1" />
              <circle cx="100" cy="100" r="50" fill="none" stroke={colors.accent} strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>

      {/* State Indicators */}
      <div className="absolute -bottom-8 flex gap-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">
        <span>M: {state.mood}</span>
        <span>E: {state.energy}%</span>
      </div>
    </div>
  );
};

export default TwinAvatar;
