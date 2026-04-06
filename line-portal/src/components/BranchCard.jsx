import React from 'react';
import { MapPin, Navigation, Phone, Clock } from 'lucide-react';

const BRANCH_DETAILS = {
  'สาขา สุขุมวิท': {
    address: '123 Sukhumvit Road, Khlong Toei, Bangkok 10110',
    coords: '13.7367,100.5604',
    phone: '02-123-4567',
    hours: '09:00 - 20:00'
  },
  'สาขา สยามสแควร์': {
    address: 'Siam Square Soi 3, Pathum Wan, Bangkok 10330',
    coords: '13.7443,100.5333',
    phone: '02-987-6543',
    hours: '10:00 - 21:00'
  },
  'สาขา ลาดพร้าว': {
    address: 'Ladprao Soi 101, Bang Kapi, Bangkok 10240',
    coords: '13.7917,100.6167',
    phone: '02-456-7890',
    hours: '09:00 - 19:00'
  }
};

export const BranchCard = ({ name, isCompact = false }) => {
  const details = BRANCH_DETAILS[name] || {
    address: 'กรุณาติดต่อเจ้าหน้าที่เพื่อขอพิกัด',
    coords: '',
    phone: '-',
    hours: '-'
  };

  const handleNavigate = () => {
    if (details.coords) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${details.coords}`, '_blank');
    }
  };

  if (isCompact) {
    return (
      <div className="flex items-center justify-between p-4 glass rounded-2xl border border-emerald-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
            <MapPin size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 tracking-tight leading-tight">{name}</h4>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide first-line:hidden line-clamp-1">{details.hours}</p>
          </div>
        </div>
        <button 
          onClick={handleNavigate}
          className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 active:scale-90 transition-all shadow-lg"
        >
          <Navigation size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-5 border border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
             <MapPin size={24} />
           </div>
           <div>
             <h3 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">{name}</h3>
             <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold tracking-widest mt-0.5 animate-pulse-slow">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
               OPEN NOW
             </div>
           </div>
        </div>
        <button 
          onClick={handleNavigate}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-xl font-bold text-xs uppercase tracking-widest"
        >
          <Navigation size={14} />
          Navigate
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-3 py-2">
        <InfoRow icon={<Phone size={14} />} label="Tel" value={details.phone} />
        <InfoRow icon={<Clock size={14} />} label="Hours" value={details.hours} />
        <div className="pt-2 mt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1.5">Address</p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-2">{details.address}</p>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 group">
    <div className="w-6 h-6 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
      {icon}
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{label}</span>
      <span className="text-sm text-slate-700 font-semibold">{value}</span>
    </div>
  </div>
);
