
import React, { useState, useEffect } from 'react';
import { db, collection, query, onSnapshot, limit } from '../firebase';

type RankingType = 'accuracy' | 'volume';

interface UserDoc {
  uid: string;
  name?: string;
  avatar?: string;
  wins?: number;
  totalPredictions?: number;
  volume?: number;
}

interface RankingEntry {
  rank: number;
  name: string;
  title: string;
  score: string;
  detail: string;
  avatar: string;
  color?: string;
  uid: string;
}

const LeaderboardView: React.FC = () => {
  const [rankingType, setRankingType] = useState<RankingType>('accuracy');
  const [accuracyLeaders, setAccuracyLeaders] = useState<RankingEntry[]>([]);
  const [volumeLeaders, setVolumeLeaders] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserDoc));
      
      // Calculate Accuracy (Precision)
      const acc = users
        .map(u => {
          const totalPredictions = u.totalPredictions || 0;
          const wins = u.wins || 0;
          const accuracy = totalPredictions > 0 ? (wins / totalPredictions) * 100 : 0;
          return {
            uid: u.uid,
            name: u.name || 'Anonymous',
            title: accuracy > 80 ? 'Precision Master' : accuracy > 50 ? 'Top Predictor' : 'Analyst',
            score: `${accuracy.toFixed(1)}%`,
            detail: `${wins} Wins`,
            avatar: u.avatar || `https://picsum.photos/seed/${u.uid}/100/100`,
            accuracyValue: accuracy
          };
        })
        .sort((a, b) => b.accuracyValue - a.accuracyValue)
        .slice(0, 10)
        .map((u, idx) => ({
          ...u,
          rank: idx + 1,
          color: idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-neutral-400' : idx === 2 ? 'text-orange-700' : ''
        }));

      // Calculate Volume
      const vol = users
        .map(u => {
          const volume = u.volume || 0;
          const totalPredictions = u.totalPredictions || 0;
          return {
            uid: u.uid,
            name: u.name || 'Anonymous',
            title: volume > 1000 ? 'Points Whale' : volume > 500 ? 'Active Predictor' : 'Player',
            score: `${volume.toLocaleString()} PTS`,
            detail: `${totalPredictions} Predictions`,
            avatar: u.avatar || `https://picsum.photos/seed/${u.uid}/100/100`,
            volumeValue: volume
          };
        })
        .sort((a, b) => b.volumeValue - a.volumeValue)
        .slice(0, 10)
        .map((u, idx) => ({
          ...u,
          rank: idx + 1,
          color: idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-neutral-400' : idx === 2 ? 'text-orange-700' : ''
        }));

      setAccuracyLeaders(acc);
      setVolumeLeaders(vol);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const currentLeaders = rankingType === 'accuracy' ? accuracyLeaders : volumeLeaders;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 animate-in fade-in duration-300 safe-top">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Leaderboard</h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mt-1">Global Standings</p>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800 active:scale-95 transition-all">
          <i className="fa-solid fa-question text-sm"></i>
        </button>
      </div>

      {/* Interactive Top Selection Cards */}
      <div className="flex gap-4 mb-10">
        <button 
          onClick={() => setRankingType('accuracy')}
          className={`flex-1 p-5 rounded-[32px] border transition-all duration-300 flex flex-col items-start gap-4 active:scale-[0.97] ${
            rankingType === 'accuracy' 
              ? 'bg-brand-600/20 border-brand-500/50 shadow-2xl shadow-brand-500/10' 
              : 'bg-neutral-900/40 border-neutral-900 opacity-60'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
            rankingType === 'accuracy' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-neutral-800 text-neutral-500'
          }`}>
            <i className="fa-solid fa-bullseye"></i>
          </div>
          <div>
            <div className="text-sm font-black uppercase tracking-tight mb-0.5">Win Rate</div>
            <div className={`text-[10px] font-bold ${rankingType === 'accuracy' ? 'text-brand-400' : 'text-neutral-500'}`}>Accuracy focused</div>
          </div>
        </button>

        <button 
          onClick={() => setRankingType('volume')}
          className={`flex-1 p-5 rounded-[32px] border transition-all duration-300 flex flex-col items-start gap-4 active:scale-[0.97] ${
            rankingType === 'volume' 
              ? 'bg-brand-600/20 border-brand-500/50 shadow-2xl shadow-brand-500/10' 
              : 'bg-neutral-900/40 border-neutral-900 opacity-60'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
            rankingType === 'volume' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'bg-neutral-800 text-neutral-500'
          }`}>
            <i className="fa-solid fa-chart-line"></i>
          </div>
          <div>
            <div className="text-sm font-black uppercase tracking-tight mb-0.5">Points</div>
            <div className={`text-[10px] font-bold ${rankingType === 'volume' ? 'text-brand-400' : 'text-neutral-500'}`}>Points focused</div>
          </div>
        </button>
      </div>

      {/* Rankings List */}
      <div className="space-y-6 pb-24">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-neutral-500">
            {rankingType === 'accuracy' ? 'Precision Rankings' : 'Points Rankings'}
          </h2>
          <div className="flex items-center gap-1.5 text-[9px] font-black text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2 py-1 rounded-full border border-brand-500/20">
            Active
            <div className="w-1 h-1 rounded-full bg-brand-500 animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="py-20 text-center">
              <i className="fa-solid fa-spinner fa-spin text-4xl text-neutral-800"></i>
              <p className="mt-4 text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Loading Standings...</p>
            </div>
          ) : currentLeaders.length === 0 ? (
            <div className="py-20 text-center opacity-50">
              <i className="fa-solid fa-ranking-star text-4xl mb-4 text-neutral-800"></i>
              <p className="text-neutral-500 font-bold italic">No rankings available yet.</p>
            </div>
          ) : currentLeaders.map((user) => (
            <div 
              key={`${rankingType}-${user.rank}`} 
              className="flex items-center gap-4 bg-neutral-900/30 border border-neutral-900/50 p-4 rounded-[28px] group cursor-pointer active:scale-[0.98] transition-all hover:bg-neutral-900/60"
            >
              {/* Rank Column */}
              <div className="w-8 flex flex-col items-center justify-center">
                {user.rank <= 3 ? (
                  <div className={`relative flex items-center justify-center`}>
                    <i className={`fa-solid fa-medal ${user.color} text-lg`}></i>
                    <span className="absolute text-[8px] font-black text-black top-1.5">{user.rank}</span>
                  </div>
                ) : (
                  <span className="text-[12px] font-black text-neutral-600 italic">
                    #{user.rank}
                  </span>
                )}
              </div>

              {/* Avatar Section */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-full border-2 overflow-hidden bg-neutral-900 flex-shrink-0 transition-transform group-hover:scale-105 ${
                  user.rank === 1 ? 'border-yellow-500/40 shadow-lg shadow-yellow-500/10' : 
                  user.rank === 2 ? 'border-neutral-400/40 shadow-lg shadow-neutral-400/10' : 
                  user.rank === 3 ? 'border-orange-700/40 shadow-lg shadow-orange-700/10' : 'border-neutral-800'
                }`}>
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                </div>
                {user.rank === 1 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] text-black font-black border-2 border-neutral-950">
                    <i className="fa-solid fa-crown"></i>
                  </div>
                )}
              </div>

              {/* User Identity */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[16px] text-white tracking-tight truncate flex items-center gap-1.5">
                  {user.name}
                  {user.rank <= 3 && <i className="fa-solid fa-circle-check text-brand-400 text-[10px]"></i>}
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2 mt-0.5">
                  <span className="text-brand-400/80">{user.title}</span>
                  <div className="w-1 h-1 rounded-full bg-neutral-800"></div>
                  <span>{user.detail}</span>
                </div>
              </div>

              {/* Performance Score */}
              <div className="text-right flex-shrink-0">
                <div className={`font-black text-[18px] tracking-tighter ${
                  rankingType === 'accuracy' ? 'text-emerald-500' : 'text-white'
                }`}>
                  {user.score}
                </div>
                <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-tighter">
                  {rankingType === 'accuracy' ? 'Success' : 'Volume'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer Spacer */}
      <div className="h-24"></div>
    </div>
  );
};

export default LeaderboardView;
