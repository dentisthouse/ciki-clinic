import React from 'react';
import { Clock, Tag, ChevronRight, Zap } from 'lucide-react';

export const ServiceCard = ({ service, onClick, isPopular = false }) => {
  const { name, price, icon: Icon, duration } = service;
  
  return (
    <button 
      onClick={onClick}
      className={`relative w-full group overflow-hidden transition-all duration-500 ease-out active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-emerald-500/20 text-left`}
    >
      <div className={`p-5 rounded-3xl ${
        isPopular 
          ? 'glass-dark text-white border-none shadow-xl border border-white/10 ring-1 ring-white/10 shadow-slate-200/50' 
          : 'glass bg-white text-slate-800 border shadow-md hover:shadow-xl transition-all duration-300'
      }`}>
        <div className="flex items-center gap-5 relative z-10">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-active:scale-95 ${
            isPopular 
              ? 'bg-gradient-to-br from-emerald-400/20 to-teal-500/10 shadow-inner' 
              : 'bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 shadow-sm'
          }`}>
            <Icon 
              size={32} 
              className={`transition-all duration-300 group-hover:scale-110 ${
                isPopular ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 'text-slate-600'
              }`} 
            />
          </div>
          
          <div className="flex-1 space-y-1.5 flex flex-col justify-center min-w-0">
             <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-[1.05rem] tracking-tight truncate leading-tight group-hover:text-emerald-500 transition-colors">
                  {name}
                </h4>
                {isPopular && (
                  <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500 text-[9px] font-black uppercase tracking-wider text-white shadow-lg animate-pulse-slow">
                    <Zap size={8} className="fill-current" />
                    Hot
                  </div>
                )}
             </div>
             <div className="flex items-center gap-4 opacity-70">
                <div className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-widest leading-none">
                  <Clock size={10} strokeWidth={3} />
                  <span>{duration}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-widest leading-none">
                  <Tag size={10} strokeWidth={3} />
                  <span>Start ฿{price.toLocaleString()}</span>
                </div>
             </div>
          </div>
          
          <div className={`p-2.5 rounded-2xl transition-all duration-500 ${
            isPopular 
              ? 'bg-white/10 group-hover:bg-white/20' 
              : 'bg-slate-100 group-hover:bg-emerald-500 group-hover:text-white'
          }`}>
             <ChevronRight size={20} className="stroke-[3]" />
          </div>
        </div>

        {/* Decorative elements */}
        {isPopular && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] opacity-40 -z-10 group-hover:opacity-60 transition-opacity duration-700"></div>
        )}
      </div>
    </button>
  );
};
