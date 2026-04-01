
import React from 'react';

interface FriendsViewProps {
  onBack: () => void;
}

const MOCK_FRIENDS = [
  { id: '1', name: 'linda', since: 'Feb 3, 2026', initial: 'L', color: 'bg-brand-500' },
  { id: '2', name: 'maimai', since: 'Jan 23, 2026', initial: 'M', color: 'bg-emerald-500' }
];

const FriendsView: React.FC<FriendsViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-white animate-in slide-in-from-bottom duration-300 z-[70] safe-top">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-neutral-900">
        <h1 className="text-2xl font-bold">Friends</h1>
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 text-neutral-400"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div className="p-6">
        <div className="flex gap-4 mb-8">
           <button className="flex-1 bg-brand-600/20 border border-brand-500/30 p-4 rounded-2xl flex flex-col items-center gap-2">
              <i className="fa-solid fa-user-plus text-brand-400"></i>
              <span className="text-xs font-bold text-brand-400">Invite Friends</span>
           </button>
           <button className="flex-1 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center gap-2">
              <i className="fa-solid fa-qrcode text-neutral-400"></i>
              <span className="text-xs font-bold text-neutral-400">My QR Code</span>
           </button>
        </div>

        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4 ml-1">Following ({MOCK_FRIENDS.length})</h2>
        <div className="space-y-3">
          {MOCK_FRIENDS.map((friend) => (
            <div key={friend.id} className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900/50 border border-neutral-900 hover:bg-neutral-900 transition-colors cursor-pointer group">
              <div className={`w-12 h-12 rounded-full ${friend.color} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                {friend.initial}
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">{friend.name}</div>
                <div className="text-xs text-neutral-500 font-medium italic">Following since {friend.since}</div>
              </div>
              <i className="fa-solid fa-chevron-right text-neutral-700 group-hover:text-neutral-500"></i>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center py-8 px-6 border border-dashed border-neutral-800 rounded-3xl">
           <i className="fa-solid fa-address-book text-3xl text-neutral-700 mb-4"></i>
           <p className="text-sm text-neutral-500 mb-6">Find people you know to see what they're predicting.</p>
           <button className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl border border-neutral-800 transition-all active:scale-95">
              Sync Contacts
           </button>
        </div>
      </div>
    </div>
  );
};

export default FriendsView;
