import React from 'react';
import { CreditCard, Star, Award, Zap } from 'lucide-react';

export const MemberCard = ({ user, liffProfile }) => {
  const isGold = user?.tier === 'Gold';
  const name = liffProfile?.displayName || user?.name || 'Member';
  const points = (user?.points || 0).toLocaleString();
  
  return (
    <div className="relative overflow-hidden p-6 rounded-3xl shadow-xl transition-all duration-500 hover:shadow-2xl active:scale-[0.98] group">
      {/* Background with dynamic gradients */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${
        isGold 
          ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700' 
          : 'bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900'
      }`}></div>
      
      {/* Decorative patterns */}
      <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700"></div>

      <div className="relative z-10 flex flex-col h-full gap-6 text-white">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {liffProfile?.pictureUrl ? (
              <img 
                src={liffProfile.pictureUrl} 
                alt={name} 
                className="w-14 h-14 rounded-2xl border-2 border-white/30 shadow-lg object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/20">
                <User size={28} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold tracking-tight drop-shadow-sm leading-tight leading-7 truncate max-w-[150px]">
                {name}
              </h2>
              <div className="flex items-center gap-1.5 opacity-80 mt-0.5">
                <Zap size={10} className="fill-current" />
                <span className="text-[11px] font-medium tracking-wide uppercase tracking-widest leading-none">
                  Member ID: #{user?.id?.slice(-6) || 'XXXXXX'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1.5 leading-none">
            <div className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-sm transform transition duration-300 hover:bg-white/30 cursor-default">
              <Star size={12} className={isGold ? 'text-yellow-300 fill-yellow-300' : 'text-slate-200'} />
              <span className="text-xs font-black tracking-widest uppercase leading-none">
                {user?.tier || 'STANDARD'}
              </span>
            </div>
            {liffProfile && (
              <div className="flex items-center gap-1 text-[10px] opacity-60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                LINE Verified
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-2 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] opacity-70 font-semibold uppercase tracking-[0.1em] leading-none">Total Points</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight tabular-nums drop-shadow-md">{points}</span>
              <span className="text-[10px] font-bold opacity-80 mb-1">PTS</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 group/qr animate-pulse-slow">
            <div className="w-16 h-16 bg-white rounded-xl p-1 shadow-inner relative group-hover/qr:scale-110 transition-transform duration-300">
               {/* Dummy QR placeholder for UI/UX demonstration */}
               <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 rounded-md flex items-center justify-center overflow-hidden">
                 <div className="w-[80%] h-[80%] border-2 border-slate-400 border-dashed rounded opacity-30"></div>
               </div>
            </div>
            <p className="text-[9px] opacity-60 font-medium tracking-widest uppercase text-center w-full leading-none">Scan to Check-in</p>
          </div>
        </div>
      </div>
    </div>
  );
};
