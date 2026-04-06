import React from 'react';
import { Stethoscope, Calendar, Clock, MapPin, ChevronRight, CheckCircle2, History } from 'lucide-react';

export const AppointmentCard = ({ appointment, onClick }) => {
  const isConfirmed = appointment.status === 'Confirmed';
  
  return (
    <button 
      onClick={onClick}
      className="w-full text-left group active:scale-[0.98] transition-all duration-300"
    >
      <div className="glass bg-white/80 p-5 rounded-[2rem] border border-slate-100 shadow-sm group-hover:shadow-xl group-hover:border-emerald-100 transition-all">
        <div className="flex gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
            isConfirmed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <Stethoscope size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-extrabold text-slate-800 tracking-tight truncate leading-tight group-hover:text-emerald-600 transition-colors">
                {appointment.treatment}
              </h4>
              <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none ${
                isConfirmed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-amber-100 text-amber-700'
              }`}>
                {isConfirmed ? 'Confirmed' : 'Pending'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-1.5 mt-2 opacity-70">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <Calendar size={12} className="text-slate-400" />
                <span>{appointment.date}</span>
                <span className="opacity-30">•</span>
                <Clock size={12} className="text-slate-400" />
                <span>{appointment.time}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <MapPin size={12} className="text-slate-400" />
                <span className="truncate">{appointment.branch || 'Main Branch'}</span>
              </div>
            </div>
          </div>
          
          <div className="self-center flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
            <ChevronRight size={18} />
          </div>
        </div>
      </div>
    </button>
  );
};
