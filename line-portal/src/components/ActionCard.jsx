import React from 'react';

export const ActionCard = ({ label, icon: Icon, onClick, color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-4 glass bg-white/50 rounded-[2rem] border transition-all duration-300 hover:shadow-lg active:scale-95 group"
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 ${colors[color]}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-800">
        {label}
      </span>
    </button>
  );
};
