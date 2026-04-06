import React from 'react';
import { Header } from './Header';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Clock, Plus } from 'lucide-react';

export const PortalLayout = ({ children, title, onBack, showProfile, user, liffProfile, activePage, onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col relative overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[50%] bg-teal-500/5 rounded-full blur-[140px] opacity-40"></div>
        <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] opacity-30"></div>
      </div>

      <Header 
        title={title} 
        onBack={onBack} 
        showProfile={showProfile} 
        user={user} 
        liffProfile={liffProfile}
        onRefresh={() => onNavigate('refresh')}
        onLogout={() => onNavigate('logout')}
        onProfileClick={() => onNavigate('profile')}
        onAppointmentsClick={() => onNavigate('appointments')}
      />

      <main className="flex-1 relative z-10 w-full max-w-xl mx-auto px-5 py-6 pb-28">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ 
                duration: 0.3, 
                ease: "easeOut"
            }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation for Premium Experience */}
      {showProfile && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md">
           <div className="glass shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[2rem] px-6 py-4 flex items-center justify-around border border-white/20 ring-1 ring-black/[0.03]">
              <NavButton 
                active={activePage === 'home'} 
                onClick={() => onNavigate('home')} 
                label="Home" 
                icon={<Home size={20} />} 
              />
              <NavButton 
                active={activePage === 'booking'} 
                onClick={() => onNavigate('booking')} 
                label="Book" 
                primary
              />
               <NavButton 
                active={activePage === 'appointments'} 
                onClick={() => onNavigate('appointments')} 
                label="History" 
                icon={<Clock size={20} />}
              />
           </div>
        </nav>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, label, icon, primary = false }) => {
  if (primary) {
    return (
      <button 
        onClick={onClick}
        className="relative -top-10 active:scale-95 transition-transform duration-300 group"
      >
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-2xl shadow-slate-900/40 ring-8 ring-slate-50 group-hover:bg-emerald-600 transition-colors duration-500">
           <div className="flex flex-col items-center">
             <Plus size={24} strokeWidth={3} />
             <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">{label}</span>
           </div>
        </div>
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 relative group active:scale-90`}
    >
      <div className={`transition-all duration-300 ${
        active ? 'text-emerald-500 scale-110 mb-1' : 'text-slate-400 group-hover:text-slate-600'
      }`}>
        {icon}
      </div>
      <div className={`text-[9px] font-black uppercase tracking-[0.15em] transition-colors duration-300 ${
        active ? 'text-emerald-600 opacity-100' : 'text-slate-400 opacity-0 group-hover:opacity-100'
      }`}>
        {label}
      </div>
    </button>
  );
};
