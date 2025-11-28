
import React from 'react';
import { X, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  onDismiss: () => void;
  actionLabel: string;
  onAction: () => void;
}

const MarketingBanner: React.FC<Props> = ({ title, description, onDismiss, actionLabel, onAction }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-900/90 to-purple-900/90 border-b border-white/10 p-4 relative animate-in slide-in-from-top fade-in backdrop-blur-md z-40">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pr-8">
        <div className="flex items-center gap-3">
           <div className="p-2 bg-white/10 rounded-full text-amber-300">
              <Sparkles size={16} />
           </div>
           <div>
             <h3 className="font-bold text-white text-sm">{title}</h3>
             <p className="text-indigo-200 text-xs leading-snug">{description}</p>
           </div>
        </div>
        <button 
          onClick={onAction}
          className="flex items-center gap-2 bg-white text-indigo-950 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20 whitespace-nowrap"
        >
          {actionLabel} <ArrowRight size={12} />
        </button>
      </div>
      <button 
        onClick={onDismiss}
        className="absolute top-2 right-2 p-2 text-white/40 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default MarketingBanner;
