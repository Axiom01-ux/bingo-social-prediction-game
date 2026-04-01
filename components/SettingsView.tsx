
import React from 'react';
import { BingoUser } from '../types';

interface SettingsViewProps {
  onBack: () => void;
  onLogout?: () => void;
  user?: BingoUser | null;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onBack, onLogout, user }) => {

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 animate-in fade-in duration-300 safe-top">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black">Profile</h1>
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 text-neutral-400">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
      </div>

      {/* User Info */}
      {user && (
        <div className="flex items-center gap-4 mb-10 p-4 bg-neutral-900/50 rounded-3xl border border-neutral-800">
          <img src={user.avatar || `https://picsum.photos/seed/${user.uid}/100/100`} alt="Avatar" className="w-16 h-16 rounded-full border-2 border-brand-500" />
          <div className="min-w-0 flex-1">
            <div className="text-xl font-black truncate">{user.name}</div>
            <div className="text-neutral-500 text-xs font-mono truncate">{user.handle}</div>
          </div>
        </div>
      )}

      {/* Referral Program */}
      <div className="mb-10 bg-gradient-to-br from-brand-600/20 to-neutral-900/50 p-6 rounded-[32px] border border-brand-500/20 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-brand-400 text-[10px] font-black uppercase tracking-widest mb-4">Referral Program</h2>
          <div className="text-xl font-black mb-1">Get points from every prediction</div>
          <p className="text-neutral-400 text-xs mb-4">Share your link and get points when your friends' predictions are correct.</p>
          
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const url = `${window.location.origin}?ref=${user?.uid}`;
                navigator.clipboard.writeText(url);
              }}
              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-2xl font-bold text-xs active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-copy"></i>
              Copy Link
            </button>
            <button 
              onClick={() => {
                const url = `${window.location.origin}?ref=${user?.uid}`;
                const text = `Join me on Bingo! Share your opinions and get points. Use my link: ${url}`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <i className="fa-brands fa-x-twitter"></i>
            </button>
          </div>
        </div>
        <i className="fa-solid fa-users absolute -right-4 -bottom-4 text-white/5 text-8xl"></i>
      </div>

      {/* Settings Options */}
      <div className="space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-neutral-500 px-2">Preferences</h2>
        <div className="bg-neutral-900/40 border border-neutral-900/50 rounded-3xl p-5 flex items-center justify-between">
           <span className="font-bold text-neutral-300">Default Network</span>
           <span className="text-neutral-500 font-medium">Base L2</span>
        </div>
        
        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full mt-8 bg-red-500/10 text-red-500 border border-red-500/20 py-4 rounded-3xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            Log Out
          </button>
        )}
      </div>

      <div className="mt-20 p-6 text-center border border-dashed border-neutral-800 rounded-[32px]">
         <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-tighter leading-relaxed">
           Your data is decentralized. <br/> No central authority controls your positions.
         </p>
      </div>

      <div className="h-32"></div>
    </div>
  );
};

export default SettingsView;
