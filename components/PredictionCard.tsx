
import React from 'react';
import { Prediction } from '../types';

interface PredictionCardProps {
  prediction: Prediction;
  isBookmarked?: boolean;
  onBookmark?: () => void;
  isLiked?: boolean;
  onLike?: () => void;
  isReposted?: boolean;
  onRepost?: () => void;
  onView?: () => void;
  onParticipate: (side: 'yes' | 'no') => void;
  onVote?: (side: 'yes' | 'no') => void;
  onShare?: (prediction: Prediction) => void;
  onClick?: () => void;
  onCommentClick?: () => void;
  currentUserId?: string;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ 
  prediction, 
  isBookmarked, 
  onBookmark, 
  isLiked,
  onLike,
  isReposted,
  onRepost,
  onView,
  onParticipate, 
  onVote,
  onShare, 
  onClick, 
  onCommentClick,
  currentUserId
}) => {
  const isResolved = prediction.isResolved;
  const isVoting = prediction.isVoting;
  const hasVoted = currentUserId && prediction.voters?.includes(currentUserId);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) onLike();
  };

  const toggleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRepost) onRepost();
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark) onBookmark();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) onShare(prediction);
  };

  const handleCardClick = () => {
    if (onView) onView();
    if (onClick) onClick();
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) onView();
    if (onCommentClick) {
      onCommentClick();
    } else if (onClick) {
      onClick();
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) onView();
  };

  const handleVoteClick = (e: React.MouseEvent, side: 'yes' | 'no') => {
    e.stopPropagation();
    if (onVote) onVote(side);
  };

  const formatCount = (count: number | undefined) => {
    if (!count) return '0';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  return (
    <div 
      className={`border-b border-neutral-800 p-2.5 hover:bg-neutral-900 transition-all duration-200 cursor-pointer active:bg-neutral-900/50 ${isResolved ? 'opacity-80' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex gap-2">
        <img 
          src={prediction.creator.avatar} 
          alt={prediction.creator.name} 
          className="w-7 h-7 rounded-full border border-neutral-800"
          onClick={(e) => { e.stopPropagation(); }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-bold text-white text-[13px] hover:underline">{prediction.creator.name}</span>
            <span className="text-neutral-500 text-[11px]">{prediction.creator.handle} · 17h</span>
            {isResolved && (
              <span className="ml-2 bg-emerald-500/10 text-emerald-500 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-emerald-500/20">Settled</span>
            )}
            {isVoting && !isResolved && (
              <span className="ml-2 bg-brand-500/10 text-brand-400 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest border border-brand-500/20 animate-pulse">Voting Open</span>
            )}
          </div>

          {(prediction.authorComment || (prediction.description && prediction.description !== "No description provided.")) && (
            <div className="text-white text-[13px] leading-relaxed mb-1.5 pr-2">
              {prediction.authorComment || prediction.description}
            </div>
          )}
          
          <div className={`rounded-lg border ${isResolved ? 'border-emerald-500/30 bg-emerald-950/5' : isVoting ? 'border-brand-500/30 bg-brand-950/5' : 'border-neutral-700 bg-neutral-900/50'} overflow-hidden mb-2 transition-colors`}>
            <div className="p-2.5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-semibold text-brand-400 uppercase tracking-wider">
                  {prediction.category} MARKET
                </span>
                <span className="text-[9px] text-neutral-500">
                  Vol: {(prediction.volume / 1000).toFixed(1)}K PTS
                </span>
              </div>
              
              <div className="flex items-end justify-between mb-1">
                <div className="max-w-[70%]">
                  <h3 className={`text-[14px] font-bold leading-snug ${isResolved ? 'text-neutral-300 line-through decoration-neutral-600' : 'text-white'}`}>
                    {prediction.question}
                  </h3>
                </div>
                <div className="text-right">
                    <span className={`text-[18px] font-black leading-none ${isResolved ? 'text-emerald-500' : 'text-brand-500'}`}>{prediction.probability}%</span>
                    <p className="text-[7px] text-neutral-500 uppercase tracking-tighter">{isResolved ? 'Outcome' : 'CHANCE'}</p>
                </div>
              </div>

              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-5 flex">
                <div 
                  className={`h-full transition-all duration-700 ${isResolved ? 'bg-emerald-500' : 'bg-brand-500'}`} 
                  style={{ width: `${prediction.probability}%` }}
                />
                <div 
                  className="h-full bg-neutral-700 transition-all duration-700" 
                  style={{ width: `${100 - prediction.probability}%` }}
                />
              </div>

              {isVoting && !isResolved ? (
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
                    <span>Community Voting</span>
                    <span>{prediction.voters?.length || 0} Votes</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={(e) => handleVoteClick(e, 'yes')}
                      disabled={hasVoted}
                      className={`py-1.5 px-3 transition-all text-white font-bold rounded-lg flex items-center justify-between text-[12px] ${
                        hasVoted ? 'bg-neutral-800 opacity-50 cursor-default' : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
                      }`}
                    >
                      <span>Yes</span>
                      <span className="opacity-70">{prediction.votesYes || 0}</span>
                    </button>
                    <button 
                      onClick={(e) => handleVoteClick(e, 'no')}
                      disabled={hasVoted}
                      className={`py-1.5 px-3 transition-all text-white font-bold rounded-lg flex items-center justify-between text-[12px] ${
                        hasVoted ? 'bg-neutral-800 opacity-50 cursor-default' : 'bg-cyan-600 hover:bg-cyan-500 active:scale-95'
                      }`}
                    >
                      <span>No</span>
                      <span className="opacity-70">{prediction.votesNo || 0}</span>
                    </button>
                  </div>
                  {hasVoted && (
                    <p className="text-[10px] text-center text-emerald-500 font-medium">You have cast your vote</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    disabled={isResolved}
                    onClick={() => onParticipate('yes')}
                    className={`py-1 px-2.5 transition-all text-white font-bold rounded-md flex items-center justify-between text-[11px] ${
                      isResolved 
                        ? prediction.result === 'yes' ? 'bg-emerald-600 border border-emerald-400 shadow-emerald-500/10' : 'bg-neutral-800 opacity-30'
                        : 'bg-brand-600 hover:bg-brand-500 active:scale-95 shadow-lg shadow-brand-600/10'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {isResolved && prediction.result === 'yes' && <i className="fa-solid fa-check animate-in zoom-in duration-300"></i>}
                      Yes
                    </span>
                    <span className="opacity-70 text-[10px] font-medium">{isResolved ? (prediction.result === 'yes' ? '1.00' : '0.00') : (prediction.prices?.yes || 0.5).toFixed(2)} PTS</span>
                  </button>
                  <button 
                    disabled={isResolved}
                    onClick={() => onParticipate('no')}
                    className={`py-1 px-2.5 transition-all text-white font-bold rounded-md flex items-center justify-between text-[11px] ${
                      isResolved 
                        ? prediction.result === 'no' ? 'bg-emerald-600 border border-emerald-400 shadow-emerald-500/10' : 'bg-neutral-800 opacity-30'
                        : 'bg-neutral-800 hover:bg-cyan-600 active:scale-95 shadow-lg shadow-neutral-900/10'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {isResolved && prediction.result === 'no' && <i className="fa-solid fa-check animate-in zoom-in duration-300"></i>}
                      No
                    </span>
                    <span className="opacity-70 text-[10px] font-medium">{isResolved ? (prediction.result === 'no' ? '1.00' : '0.00') : (prediction.prices?.no || 0.5).toFixed(2)} PTS</span>
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-neutral-800/30 px-4 py-1.5 flex items-center justify-between border-t border-neutral-800/50">
                <span className="text-[9px] text-neutral-500 italic">
                  {isResolved ? `Closed. Final result: ${prediction.result?.toUpperCase()}` : isVoting ? 'Market closed for participation. Community voting in progress.' : 'For entertainment purposes only. Community voting decides outcome.'}
                </span>
                <i className="fa-solid fa-chevron-right text-neutral-600 text-[9px]"></i>
            </div>
          </div>

          <div className="flex justify-between text-neutral-500 max-w-sm px-1">
            <button className="flex items-center gap-1 group transition-all active:scale-90 p-1 -m-1" onClick={handleCommentClick}>
              <i className="fa-regular fa-comment text-[12px] group-hover:text-brand-400"></i>
              <span className="text-[11px] group-hover:text-brand-400">{formatCount(prediction.commentsCount)}</span>
            </button>
            <button 
              className={`flex items-center gap-1 group transition-all active:scale-90 p-1 -m-1 ${isReposted ? 'text-green-500' : ''}`}
              onClick={toggleRepost}
            >
              <i className={`fa-solid fa-retweet text-[12px] ${isReposted ? 'text-green-500' : 'group-hover:text-green-500'}`}></i>
              <span className={`text-[11px] ${isReposted ? 'text-green-500' : 'group-hover:text-green-500'}`}>{formatCount(prediction.repostsCount)}</span>
            </button>
            <button 
              className={`flex items-center gap-1 group transition-all active:scale-90 p-1 -m-1 ${isLiked ? 'text-red-500' : ''}`}
              onClick={toggleLike}
            >
              <i className={`${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart text-[12px] ${isLiked ? 'text-red-500 scale-110' : 'group-hover:text-red-500'}`}></i>
              <span className={`text-[11px] ${isLiked ? 'text-red-500' : 'group-hover:text-red-500'}`}>{formatCount(prediction.likesCount)}</span>
            </button>
            <button className="flex items-center gap-1 group transition-all active:scale-90 p-1 -m-1" onClick={handleActionClick}>
              <i className="fa-solid fa-chart-simple text-[12px] group-hover:text-brand-400"></i>
              <span className="text-[11px] group-hover:text-brand-400">{formatCount(prediction.viewsCount)}</span>
            </button>
            <button 
              className={`transition-all active:scale-90 p-1 -m-1 ${isBookmarked ? 'text-brand-400' : ''}`}
              onClick={handleBookmarkClick}
            >
              <i className={`${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-bookmark text-[12px] ${isBookmarked ? 'text-brand-400 scale-110' : 'group-hover:text-brand-400'}`}></i>
            </button>
            <button 
              onClick={handleShare}
              className="hover:text-brand-400 transition-all active:scale-90 p-1 -m-1"
            >
              <i className="fa-solid fa-share-nodes text-[12px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
