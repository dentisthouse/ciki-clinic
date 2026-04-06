import React from 'react';
import { Calendar, User, LogOut, ArrowLeft, Loader2 } from 'lucide-react';

export const Header = ({ title, onBack, showProfile = true, onRefresh, onLogout, onProfileClick, onAppointmentsClick, user, liffProfile }) => {
  return (
    <header className="sticky top-0 z-50 glass border-b border-white/20 px-4 py-3 flex items-center justify-between min-h-[72px]">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden p-1">
            <img 
              src="https://img5.pic.in.th/file/secure-sv1/Untitled-1736b41697298642a.png" 
              alt="Baan Moh Fun Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-extrabold text-slate-800 tracking-tight text-lg">บ้านหมอฟัน</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl text-[10px] font-black text-slate-800 shadow-sm">
          TH
        </div>
        {showProfile && (
          <div className="flex items-center gap-1">
            <IconButton icon={<LogOut size={18} />} onClick={onLogout} variant="danger" />
          </div>
        )}
      </div>
    </header>
  );
};

const IconButton = ({ icon, onClick, variant = 'default' }) => {
  const baseClasses = "p-2 rounded-full transition-all duration-200 active:scale-90";
  const variants = {
    default: "text-slate-600 hover:bg-slate-100",
    danger: "text-rose-500 hover:bg-rose-50"
  };
  
  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      {icon}
    </button>
  );
};
