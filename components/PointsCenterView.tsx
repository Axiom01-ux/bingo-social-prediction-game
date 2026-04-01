
import React from 'react';
import { Prediction, UserPosition } from '../types';

interface PointsCenterViewProps {
  userCreations?: Prediction[];
  userPositions?: (UserPosition & { prediction: Prediction })[];
  onSelectPrediction?: (p: Prediction) => void;
  onResolve?: (p: Prediction) => void;
  balance?: number;
}

const PointsCenterView: React.FC<PointsCenterViewProps> = ({ 
  userCreations = [], 
  userPositions = [],
  onSelectPrediction, 
  onResolve,
  balance = 0
}) => {

  const formatDate = (date: string | { toDate?: () => Date }) => {
    if (!date) return 'N/A';
    // Handle Firestore Timestamp
    if (typeof date !== 'string' && date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    // Handle JS Date (though not explicitly in type, good for safety)
    if (date instanceof Date) {
      return (date as Date).toLocaleDateString();
    }
    // Handle string
    return String(date);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 animate-in fade-in duration-300 pb-32 safe-top">
      {/* Header Status */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Points Center</h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">Personal Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
            <i className="fa-solid fa-coins"></i>
          </div>
        </div>
      </div>

      {/* Asset Overview */}
      <div className="mb-12 bg-gradient-to-br from-brand-600/20 to-neutral-900/50 p-8 rounded-[40px] border border-brand-500/20 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Available PTS</div>
          </div>
          <div className="text-[52px] font-black leading-tight tracking-tighter">{balance.toLocaleString()} PTS</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-1 rounded-full border border-emerald-500/20">
              Active Portfolio
            </span>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full"></div>
      </div>

      {/* Core: My Positions */}
      <section className="mb-10">
        <div className="flex justify-between items-end mb-6 px-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">My Positions (Active)</h2>
          <span className="text-brand-400 text-[10px] font-bold">{userPositions.length} Positions</span>
        </div>
        
        {userPositions.length > 0 ? (
          <div className="space-y-4">
            {userPositions.map((pos, idx) => (
              <div 
                key={idx} 
                className="bg-neutral-900/60 rounded-[32px] p-5 border border-neutral-800 active:scale-[0.98] transition-transform cursor-pointer hover:border-brand-500/30"
                onClick={() => onSelectPrediction?.(pos.prediction)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${pos.side === 'yes' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                      {pos.side.toUpperCase()}
                    </div>
                    <div className="max-w-[180px]">
                      <div className="font-bold text-[14px] line-clamp-1">{pos.prediction.question}</div>
                      <div className="text-[10px] text-neutral-500 font-medium">Holding: {pos.shares.toFixed(2)} Shares</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-black text-sm">{Math.floor(pos.shares * pos.avgPrice)} PTS</div>
                    <div className="text-[9px] text-emerald-500 font-bold">Allocated</div>
                  </div>
                </div>
                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                   <div className="h-full bg-brand-500" style={{ width: `${pos.prediction.probability}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-900/20 border border-dashed border-neutral-800 rounded-[32px] py-10 flex flex-col items-center justify-center text-neutral-600">
             <i className="fa-solid fa-chart-pie text-2xl mb-2"></i>
             <p className="text-[11px] font-bold uppercase tracking-widest">No active positions</p>
          </div>
        )}
      </section>

      {/* Core: My Predictions */}
      <section className="mb-10">
        <div className="flex justify-between items-end mb-6 px-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">My Predictions (History)</h2>
          <i className="fa-solid fa-clock-rotate-left text-neutral-700 text-xs"></i>
        </div>

        {userCreations.length > 0 ? (
          <div className="space-y-4">
            {userCreations.map((p) => (
              <div 
                key={p.id} 
                className="bg-neutral-900/40 rounded-[28px] p-5 flex items-center gap-4 border border-neutral-800 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:bg-brand-500/20 transition-colors">
                  <i className="fa-solid fa-bolt text-xl"></i>
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => onSelectPrediction?.(p)}>
                  <div className="font-bold text-[15px] line-clamp-1">{p.question}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-neutral-500 font-black uppercase tracking-tighter">
                      {p.isResolved ? 'Resolved' : `Ends: ${formatDate(p.endTime)}`}
                    </span>
                    <div className="w-1 h-1 rounded-full bg-neutral-800"></div>
                    <span className="text-[9px] text-brand-400 font-bold">{p.category}</span>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  {!p.isResolved ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onResolve?.(p); }}
                      className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-xl active:scale-90 transition-transform shadow-lg shadow-white/5"
                    >
                      Finalize
                    </button>
                  ) : (
                    <div className="text-right">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${p.result === 'yes' ? 'text-emerald-500' : 'text-red-500'}`}>
                         RESULT: {p.result}
                       </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-neutral-900/20 border border-dashed border-neutral-800 rounded-[32px] py-10 flex flex-col items-center justify-center text-neutral-600">
             <i className="fa-solid fa-plus-circle text-2xl mb-2"></i>
             <p className="text-[11px] font-bold uppercase tracking-widest">No predictions created yet</p>
          </div>
        )}
      </section>

    </div>
  );
};

export default PointsCenterView;
