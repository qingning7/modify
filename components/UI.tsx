
import React from 'react';
import { TreeConfig } from '../types';

interface UIProps {
  config: TreeConfig;
  updateConfig: (key: keyof TreeConfig, value: any) => void;
}

export const UI: React.FC<UIProps> = ({ config, updateConfig }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 font-serif">
      
      {/* Minimal Header */}
      <header className="absolute top-8 left-0 w-full text-center pointer-events-none">
        <h1 className="text-3xl md:text-5xl text-gold-400 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] uppercase tracking-widest font-bold bg-clip-text text-transparent bg-gradient-to-b from-gold-100 to-gold-600 leading-tight">
          To Olivia: <br/> Merry Christmas!
        </h1>
        <p className="text-gold-200/60 text-xs tracking-[0.5em] mt-4 uppercase">
          Interactive Experience
        </p>
      </header>

      {/* Interaction Corner */}
      <div className="absolute bottom-10 right-10 pointer-events-auto">
        <button
            onClick={() => updateConfig('treeState', config.treeState === 'FORMED' ? 'CHAOS' : 'FORMED')}
            className={`
                group relative flex items-center justify-center
                w-24 h-24 md:w-32 md:h-32 rounded-full
                border-2 transition-all duration-700 ease-in-out shadow-[0_0_30px_rgba(0,0,0,0.5)]
                ${config.treeState === 'FORMED' 
                    ? 'bg-black/80 border-gold-500/50 hover:border-red-500 hover:bg-red-950/30' 
                    : 'bg-gold-600/20 border-gold-400 hover:bg-gold-600/40 hover:scale-105'}
            `}
        >
            <div className={`
                absolute inset-1 rounded-full border border-dashed border-white/20 animate-[spin_10s_linear_infinite]
                ${config.treeState === 'CHAOS' ? 'animate-[spin_4s_linear_infinite]' : ''}
            `}></div>
            
            <span className={`
                text-xs md:text-sm font-bold uppercase tracking-widest transition-colors duration-300
                ${config.treeState === 'FORMED' ? 'text-gold-100 group-hover:text-red-300' : 'text-gold-300'}
            `}>
                {config.treeState === 'FORMED' ? 'Scatter' : 'Build'}
            </span>
        </button>
      </div>

    </div>
  );
};
