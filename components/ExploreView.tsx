
import React, { useState, useMemo } from 'react';
import { Prediction } from '../types';

interface ExploreViewProps {
  allPredictions?: Prediction[];
  bookmarkedIds?: Set<string>;
  onBookmark?: (id: string) => void;
  onSelectPrediction?: (p: Prediction) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

const ProgressCircle: React.FC<{ percentage: number }> = ({ percentage }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-neutral-800"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-emerald-500 transition-all duration-1000"
        />
      </svg>
      <span className="absolute text-[10px] font-black text-emerald-500">{percentage}%</span>
    </div>
  );
};

const ExploreView: React.FC<ExploreViewProps> = ({ 
  allPredictions = [], 
  bookmarkedIds = new Set(),
  onSelectPrediction,
  searchQuery = '',
  onSearchChange
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'trending' | 'user' | 'saved'>('all');

  const filteredPredictions = useMemo(() => {
    return allPredictions.filter(prediction => {
      const matchesSearch = (prediction.question || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (activeCategory === 'saved') return matchesSearch && bookmarkedIds.has(prediction.id);
      if (activeCategory === 'all') return matchesSearch;
      
      // Trending logic: Show AI-generated predictions (creatorUid === 'system')
      if (activeCategory === 'trending') return matchesSearch && prediction.creatorUid === 'system';
      
      // User logic: Show predictions made by real users
      const isUserMade = prediction.creatorUid !== 'system';
      if (activeCategory === 'user') return matchesSearch && isUserMade;
      
      return matchesSearch;
    });
  }, [searchQuery, activeCategory, bookmarkedIds, allPredictions]);

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
    <div className="min-h-screen bg-neutral-950 text-white p-6 animate-in fade-in duration-300 safe-top">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black">Explore</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <i className="fa-solid fa-magnifying-glass text-neutral-600"></i>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="Search markets or creators..."
          className="w-full bg-neutral-900 border border-neutral-800/50 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-brand-500/50 placeholder:text-neutral-600 transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => onSearchChange && onSearchChange('')}
            className="absolute inset-y-0 right-4 flex items-center text-neutral-600 hover:text-white"
          >
            <i className="fa-solid fa-circle-xmark"></i>
          </button>
        )}
      </div>

      {/* Category Chips */}
      <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide pb-2">
        <button 
          onClick={() => setActiveCategory('trending')}
          className={`flex-shrink-0 px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold active:scale-95 transition-all border ${
            activeCategory === 'trending' 
              ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-600/20' 
              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
          }`}
        >
          <span className="text-orange-500">🔥</span>
          Hot Markets
        </button>
        <button 
          onClick={() => setActiveCategory('user')}
          className={`flex-shrink-0 px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold active:scale-95 transition-all border ${
            activeCategory === 'user' 
              ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-600/20' 
              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
          }`}
        >
          <span className="text-blue-400">👥</span>
          User Generated
        </button>
        <button 
          onClick={() => setActiveCategory('saved')}
          className={`flex-shrink-0 px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-bold active:scale-95 transition-all border ${
            activeCategory === 'saved' 
              ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-600/20' 
              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
          }`}
        >
          <span className="text-brand-400">🔖</span>
          Saved
        </button>
        {activeCategory !== 'all' && (
          <button 
            onClick={() => setActiveCategory('all')}
            className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-neutral-400 px-4"
          >
            Clear
          </button>
        )}
      </div>

      {/* Predictions List */}
      <div className="space-y-4 pb-32">
        {filteredPredictions.length > 0 ? (
          filteredPredictions.map((prediction) => (
            <div
              key={prediction.id}
              onClick={() => onSelectPrediction && onSelectPrediction(prediction)}
              className="bg-neutral-900/40 border border-neutral-900/60 rounded-3xl p-5 flex items-center gap-4 group hover:bg-neutral-900/60 transition-colors cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-neutral-500 text-[11px] font-bold uppercase tracking-wider">
                    <i className={`fa-solid ${prediction.volume > 10 ? 'fa-fire text-orange-500' : 'fa-user text-blue-400'} text-[10px]`}></i>
                    {prediction.category || 'MARKET'}
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] font-bold">
                    <i className="fa-regular fa-clock"></i>
                    {formatDate(prediction.endTime)}
                  </div>
                </div>
                <h3 className="text-[15px] font-bold leading-tight pr-4">
                  {prediction.question}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                <ProgressCircle percentage={prediction.probability} />
                <i className="fa-solid fa-chevron-right text-neutral-800 text-sm group-hover:text-neutral-600 transition-colors"></i>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-50">
            <i className="fa-solid fa-magnifying-glass text-4xl mb-4 text-neutral-800"></i>
            <p className="text-neutral-500 font-bold italic">
              {activeCategory === 'saved' ? "You haven't saved any markets yet." : `No matches found for "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreView;
