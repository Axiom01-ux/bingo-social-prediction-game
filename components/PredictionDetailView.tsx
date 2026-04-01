
import React, { useState, useEffect } from 'react';
import { Prediction, Comment, UserPosition, FirestoreTimestamp } from '../types';
import { 
  db, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  setDoc,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  handleFirestoreError,
  OperationType,
  Timestamp
} from '../firebase';

interface PredictionDetailViewProps {
  prediction: Prediction;
  initialTab?: 'positions' | 'comments';
  onBack: () => void;
  onParticipate: (side: 'yes' | 'no') => void;
  onVote?: (side: 'yes' | 'no') => void;
  onStartVoting?: (p: Prediction) => void;
  onFinalizeVoting?: (p: Prediction) => void;
  onReport?: (id: string, type: 'prediction' | 'comment') => void;
  onDispute?: (p: Prediction) => void;
  onGenerateVideo?: (p: Prediction) => void;
  currentUser: { uid: string; name: string; avatar: string; handle: string };
  userPositions: UserPosition[];
  isAdmin?: boolean;
}

const ShareSheet: React.FC<{ isOpen: boolean; onClose: () => void; prediction: Prediction; user?: { uid: string } }> = ({ isOpen, onClose, prediction, user }) => {
  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}?predictionId=${prediction.id}&ref=${user?.uid}`;
  const shareText = `Check out this prediction on Bingo: "${prediction.question}"! Current probability: ${prediction.probability}%. Join me here:`;

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
    onClose();
  };

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-neutral-900 rounded-t-[40px] p-6 pb-12 shadow-2xl border-t border-neutral-800 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-neutral-800 rounded-full mx-auto mb-6 opacity-50"></div>
        
        <div className="flex items-center justify-between mb-10 px-2">
          <button onClick={onClose} className="text-neutral-400 font-medium text-lg">Cancel</button>
          <h2 className="text-white text-2xl font-bold">Share</h2>
          <div className="w-14"></div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { icon: 'fa-link', label: 'Copy link', color: 'bg-neutral-800', text: 'text-white', onClick: handleCopyLink },
            { icon: 'fa-x-twitter', label: 'Twitter', color: 'bg-black', text: 'text-white', brand: true, onClick: handleTwitterShare },
            { icon: 'fa-paper-plane', label: 'Telegram', color: 'bg-sky-500/20', text: 'text-sky-400', onClick: handleTelegramShare },
            { icon: 'fa-whatsapp', label: 'WhatsApp', color: 'bg-green-500/20', text: 'text-green-500', brand: true, onClick: () => {
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
              window.open(whatsappUrl, '_blank');
              onClose();
            }},
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-3 group cursor-pointer" onClick={item.onClick}>
              <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center ${item.text} text-2xl group-active:scale-90 transition-transform`}>
                <i className={`${item.brand ? 'fa-brands' : 'fa-solid'} ${item.icon}`}></i>
              </div>
              <span className="text-neutral-400 text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>

        <button 
          className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-5 rounded-3xl flex items-center justify-center gap-2 text-lg active:scale-[0.98] transition-all"
          onClick={onClose}
        >
          Invite Friends
          <i className="fa-solid fa-chevron-right text-sm opacity-50"></i>
        </button>
      </div>
    </div>
  );
};

const PredictionDetailView: React.FC<PredictionDetailViewProps> = ({ 
  prediction, 
  initialTab, 
  onBack, 
  onParticipate, 
  onVote,
  onStartVoting,
  onFinalizeVoting,
  onReport, 
  onDispute, 
  currentUser, 
  userPositions, 
  isAdmin 
}) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'positions' | 'comments'>(initialTab || 'comments');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [disputeTimeLeft, setDisputeTimeLeft] = useState<string | null>(null);

  const hasVoted = currentUser && prediction.voters?.includes(currentUser.uid);

  useEffect(() => {
    if (prediction.isResolved && prediction.resolvedAt) {
      const timer = setInterval(() => {
        const resolvedDate = typeof prediction.resolvedAt === 'string' 
          ? new Date(prediction.resolvedAt) 
          : (prediction.resolvedAt as FirestoreTimestamp).toDate?.() || new Date();
        const now = new Date();
        const diff = (resolvedDate.getTime() + 6 * 60 * 60 * 1000) - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setDisputeTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setDisputeTimeLeft(null);
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [prediction.isResolved, prediction.resolvedAt]);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('predictionId', '==', prediction.id),
      orderBy('time', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Timestamp to a readable string or handle it in the UI
          time: data.time instanceof Timestamp ? data.time.toDate().toLocaleString() : data.time
        } as Comment;
      });
      setComments(fetchedComments);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `comments/${prediction.id}`));

    return () => unsubscribe();
  }, [prediction.id]);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    
    // Find if current user has a position on this prediction
    const userPos = userPositions.find(p => p.predictionId === prediction.id);

    const commentData = {
      user: currentUser.name,
      uid: currentUser.uid,
      avatar: currentUser.avatar,
      text: newComment,
      time: serverTimestamp(),
      likes: 0,
      predictionId: prediction.id,
      positionSide: userPos?.side || null,
      positionAmount: userPos?.shares ? userPos.shares * userPos.avgPrice : null
    };

    try {
      const commentRef = doc(collection(db, 'comments'));
      await setDoc(commentRef, commentData);
      await updateDoc(doc(db, 'predictions', prediction.id), {
        commentsCount: increment(1)
      });
      setNewComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'comments');
    }
  };

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
    <div className="fixed inset-0 z-[60] bg-neutral-950 text-white animate-in slide-in-from-right duration-300 pb-40 overflow-y-auto">
      {/* Header */}
      <div className="p-4 flex items-center border-b border-neutral-900 sticky top-0 bg-neutral-950/90 backdrop-blur-md z-30 safe-top">
        <button onClick={onBack} className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors active:scale-90">
          <i className="fa-solid fa-chevron-left text-xl"></i>
        </button>
        <h1 className="flex-1 text-center font-bold text-lg">Market Info</h1>
        <button onClick={() => setIsShareOpen(true)} className="p-2 -mr-2 text-neutral-400 hover:text-white transition-colors active:scale-90">
          <i className="fa-solid fa-arrow-up-from-bracket text-xl"></i>
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Main Info Card */}
        <div className="bg-neutral-900/50 rounded-3xl p-6 border border-neutral-800 shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                {prediction.category} Market
              </span>
              <button 
                onClick={() => onReport?.(prediction.id, 'prediction')}
                className="flex items-center gap-1.5 text-neutral-600 hover:text-red-400 transition-colors text-[10px] font-bold uppercase tracking-widest"
              >
                <i className="fa-solid fa-flag text-[8px]"></i>
                Report
              </button>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-brand-600 rounded-md flex items-center justify-center">
                 <i className="fa-solid fa-bolt text-white text-[10px]"></i>
              </div>
              <span className="font-bold text-sm text-neutral-200">Bingo</span>
              <i className="fa-solid fa-crown text-yellow-500 text-xs"></i>
            </div>
          </div>

          <h2 className="text-2xl font-bold leading-tight mb-4 text-white">
            {prediction.question}
          </h2>

          {(prediction.authorComment || (prediction.description && prediction.description !== "No description provided.")) && (
            <div className="text-neutral-400 text-sm leading-relaxed mb-6 bg-neutral-800/30 p-4 rounded-2xl border border-neutral-800/50">
              <div className="flex items-center gap-2 mb-2 text-neutral-500 font-bold text-[10px] uppercase tracking-widest">
                <i className="fa-solid fa-quote-left text-brand-500"></i>
                Market Logic
              </div>
              {prediction.authorComment || prediction.description}
            </div>
          )}
          
          {/* Probability Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
              <span className={prediction.isResolved ? 'text-emerald-500' : 'text-brand-500'}>Yes {prediction.probability}%</span>
              <span className="text-neutral-500">No {100 - prediction.probability}%</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden flex">
               <div className={`h-full transition-all duration-700 ${prediction.isResolved ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${prediction.probability}%` }}></div>
               <div className="h-full bg-neutral-700 transition-all duration-700" style={{ width: `${100 - prediction.probability}%` }}></div>
            </div>
          </div>

          <div className="flex justify-between items-center text-neutral-400 text-sm">
             <div className="flex items-center gap-1.5 font-medium">
                <i className="fa-regular fa-clock text-neutral-500"></i>
                <span>Ends {formatDate(prediction.endTime)}</span>
             </div>
             <div className="flex items-center gap-4 font-bold text-white">
                <span className="text-brand-400">{(prediction.volume / 1000).toFixed(2)}K Vol PTS</span>
                <div className="flex items-center gap-1 text-neutral-400 font-medium">
                   <i className="fa-solid fa-users text-neutral-500"></i>
                   <span>{prediction.voters?.length || 0}</span>
                </div>
             </div>
          </div>

          {/* Resolve/Voting Buttons for Creator or Admin */}
          {(currentUser.uid === prediction.creatorUid || isAdmin) && !prediction.isResolved && (
            <div className="mt-6 pt-6 border-t border-neutral-800 space-y-3">
              {!prediction.isVoting ? (
                <button 
                  onClick={() => onStartVoting?.(prediction)}
                  className="w-full py-4 bg-brand-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-box-archive"></i>
                  START COMMUNITY VOTING
                </button>
              ) : (
                <button 
                  onClick={() => onFinalizeVoting?.(prediction)}
                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-check-double"></i>
                  FINALIZE & SETTLE MARKET
                </button>
              )}
              <p className="text-center text-[10px] text-neutral-500 mt-2 font-bold uppercase tracking-widest">
                {isAdmin ? "Admin Control Access" : "Only you as the creator can manage this market"}
              </p>
            </div>
          )}
        </div>

        {/* User Position Card */}
        {userPositions.find(p => p.predictionId === prediction.id) && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-5 animate-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <i className="fa-solid fa-briefcase text-xs"></i>
                </div>
                <span className="font-bold text-white text-sm">Your Position</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${userPositions.find(p => p.predictionId === prediction.id)?.side === 'yes' ? 'bg-emerald-500 text-white' : 'bg-cyan-600 text-white'}`}>
                {userPositions.find(p => p.predictionId === prediction.id)?.side}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">Shares</p>
                <p className="text-white font-black text-lg">{userPositions.find(p => p.predictionId === prediction.id)?.shares.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">Avg Price</p>
                <p className="text-white font-black text-lg">{userPositions.find(p => p.predictionId === prediction.id)?.avgPrice.toFixed(2)} PTS</p>
              </div>
            </div>
          </div>
        )}

        {/* Promo Banner */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="bg-brand-600/10 border border-brand-500/20 rounded-3xl p-5 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => setIsShareOpen(true)}
          >
            <div className="flex flex-col gap-3 relative z-10">
              <div className="w-10 h-10 bg-brand-600/20 border border-brand-500/30 rounded-xl flex items-center justify-center text-brand-400">
                <i className="fa-solid fa-share-nodes text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">Share</h3>
                <p className="text-neutral-400 text-[10px]">Invite friends</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
          </div>

          <div 
            className="bg-purple-600/10 border border-purple-500/20 rounded-3xl p-5 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => onGenerateVideo?.(prediction)}
          >
            <div className="flex flex-col gap-3 relative z-10">
              <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
                <i className="fa-solid fa-clapperboard text-lg"></i>
              </div>
              <div>
                <h3 className="font-bold text-white text-xs">AI Video</h3>
                <p className="text-neutral-400 text-[10px]">Generate summary</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
          </div>
        </div>

        {/* Tabs System */}
        <div className="space-y-4">
          <div className="flex border-b border-neutral-900 px-1">
            <button 
              onClick={() => setActiveTab('positions')}
              className={`pb-3 px-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'positions' ? 'text-white' : 'text-neutral-600'}`}
            >
              Positions
              {activeTab === 'positions' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-500 rounded-full animate-in zoom-in-x duration-200"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`pb-3 px-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'comments' ? 'text-white' : 'text-neutral-600'}`}
            >
              Comments
              {activeTab === 'comments' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-500 rounded-full animate-in zoom-in-x duration-200"></div>}
            </button>
          </div>

          <div className="animate-in fade-in duration-300">
            {activeTab === 'positions' ? (
              <div className="space-y-4 pt-2">
                  { [
                    { user: 'hags55', amount: '775', side: 'No', color: 'text-cyan-400', avatar: 'https://picsum.photos/seed/hags/100/100' },
                    { user: 'jordanv', amount: '1000', side: 'No', color: 'text-cyan-400', avatar: 'https://picsum.photos/seed/jordan/100/100' },
                    { user: 'airdropped', amount: '300', side: 'No', color: 'text-cyan-400', avatar: 'https://picsum.photos/seed/air/100/100' },
                  ].map((pos, i) => (
                  <div key={i} className="flex gap-3 items-center border-b border-neutral-900/50 pb-4 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                    <img src={pos.avatar} className="w-8 h-8 rounded-full border border-neutral-800" alt={pos.user} />
                    <div className="flex-1">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-bold text-white hover:underline cursor-pointer">{pos.user}</span>
                        <span className="text-neutral-500 font-medium">allocated</span>
                        <span className={`${pos.color} font-black`}>{pos.amount} PTS</span>
                        <span className="text-neutral-500 font-medium">on {pos.side}</span>
                      </div>
                      <span className="text-[10px] text-neutral-600 font-medium">Just now</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6 pt-2 pb-20">
                {/* Comment Input */}
                <div className="flex gap-3 items-start bg-neutral-900/30 p-4 rounded-2xl border border-neutral-800 focus-within:border-brand-500/50 transition-colors">
                  <img src={currentUser.avatar} className="w-8 h-8 rounded-full border border-neutral-800" alt="me" />
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                      placeholder="Add a comment..."
                      className="bg-transparent border-none text-sm w-full focus:ring-0 placeholder:text-neutral-600 font-medium"
                    />
                    <button 
                      onClick={handleSendComment}
                      disabled={!newComment.trim()}
                      className="text-brand-400 font-black text-[11px] uppercase tracking-widest disabled:opacity-30 active:scale-90 transition-transform"
                    >
                      Post
                    </button>
                  </div>
                </div>

                {/* Comment List */}
                <div className="space-y-6">
                  {comments.map((comment, i) => (
                    <div key={comment.id} className="flex gap-3 items-start group animate-in slide-in-from-bottom duration-300" style={{ animationDelay: `${i * 30}ms` }}>
                      <img src={comment.avatar} className="w-9 h-9 rounded-full border border-neutral-800" alt={comment.user} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-[13px]">{comment.user}</span>
                            {comment.positionSide && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${comment.positionSide === 'yes' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                {comment.positionSide} {comment.positionAmount?.toFixed(0)} PTS
                              </span>
                            )}
                            <span className="text-[10px] text-neutral-600 font-medium">{comment.time}</span>
                          </div>
                          <button className="text-neutral-600 group-hover:text-neutral-400 transition-colors active:scale-90">
                            <i className="fa-solid fa-ellipsis text-xs"></i>
                          </button>
                        </div>
                        <p className="text-[14px] text-neutral-300 leading-relaxed font-medium">
                          {comment.text}
                        </p>
                        <div className="flex items-center gap-4 pt-1">
                          <button className="flex items-center gap-1.5 text-neutral-600 hover:text-red-500 transition-colors active:scale-90">
                            <i className="fa-regular fa-heart text-[10px]"></i>
                            <span className="text-[10px] font-bold">{comment.likes > 0 ? comment.likes : 'Like'}</span>
                          </button>
                          <button className="text-neutral-600 hover:text-brand-400 transition-colors font-bold text-[10px] active:scale-90">Reply</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-4 bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-900 pb-10 z-40">
        {prediction.isResolved ? (
          <div className="space-y-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Final Outcome</p>
                <p className="text-2xl font-black text-white uppercase italic">{prediction.result}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Market Status</p>
                <p className="text-emerald-500 font-black">SETTLED</p>
              </div>
            </div>
            
            {disputeTimeLeft && (
              <button 
                onClick={() => onDispute?.(prediction)}
                className="w-full py-4 bg-orange-500/10 border border-orange-500/30 text-orange-400 font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-orange-500/20 transition-all active:scale-95"
              >
                <i className="fa-solid fa-gavel"></i>
                DISPUTE RESULT ({disputeTimeLeft})
              </button>
            )}
          </div>
        ) : prediction.isVoting ? (
          <div className="space-y-4">
             <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-1">
                <span>Community Voting Phase</span>
                <span>{prediction.voters?.length || 0} Votes Cast</span>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onVote?.('yes')}
                  disabled={hasVoted}
                  className={`group transition-all duration-300 rounded-2xl p-4 flex flex-col items-center justify-center border active:scale-95 shadow-lg ${
                    hasVoted ? 'bg-neutral-900 border-neutral-800 opacity-50 cursor-default' : 'bg-neutral-900 hover:bg-brand-600 border-neutral-800 hover:border-brand-400'
                  }`}
                >
                  <span className={`font-black text-xl uppercase italic ${hasVoted ? 'text-neutral-500' : 'text-brand-500 group-hover:text-white'}`}>Yes</span>
                  <span className="text-neutral-500 group-hover:text-brand-100 text-[10px] font-bold tracking-widest mt-0.5">{prediction.votesYes || 0} Votes</span>
                </button>
                <button 
                  onClick={() => onVote?.('no')}
                  disabled={hasVoted}
                  className={`group transition-all duration-300 rounded-2xl p-4 flex flex-col items-center justify-center border active:scale-95 shadow-lg ${
                    hasVoted ? 'bg-neutral-900 border-neutral-800 opacity-50 cursor-default' : 'bg-neutral-900 hover:bg-cyan-600 border-neutral-800 hover:border-cyan-400'
                  }`}
                >
                  <span className={`font-black text-xl uppercase italic ${hasVoted ? 'text-neutral-500' : 'text-cyan-400 group-hover:text-white'}`}>No</span>
                  <span className="text-neutral-500 group-hover:text-cyan-100 text-[10px] font-bold tracking-widest mt-0.5">{prediction.votesNo || 0} Votes</span>
                </button>
             </div>
             {hasVoted && (
               <p className="text-center text-emerald-500 text-xs font-bold animate-in fade-in zoom-in duration-300">
                 <i className="fa-solid fa-circle-check mr-1.5"></i>
                 Your vote has been recorded
               </p>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => onParticipate('yes')}
              className="group bg-neutral-900 hover:bg-brand-600 transition-all duration-300 rounded-2xl p-4 flex flex-col items-center justify-center border border-neutral-800 hover:border-brand-400 active:scale-95 shadow-lg shadow-black/20"
            >
              <span className="font-black text-brand-500 group-hover:text-white text-xl uppercase italic">Yes</span>
              <span className="text-neutral-500 group-hover:text-brand-100 text-[10px] font-bold tracking-widest mt-0.5">{(prediction.prices?.yes || 0.5).toFixed(2)} PTS</span>
            </button>
            <button 
              onClick={() => onParticipate('no')}
              className="group bg-neutral-900 hover:bg-cyan-600 transition-all duration-300 rounded-2xl p-4 flex flex-col items-center justify-center border border-neutral-800 hover:border-cyan-400 active:scale-95 shadow-lg shadow-black/20"
            >
              <span className="font-black text-cyan-400 group-hover:text-white text-xl uppercase italic">No</span>
              <span className="text-neutral-500 group-hover:text-cyan-100 text-[10px] font-bold tracking-widest mt-0.5">{(prediction.prices?.no || 0.5).toFixed(2)} PTS</span>
            </button>
          </div>
        )}
        <p className="text-center text-[9px] text-neutral-600 mt-3 font-medium">
          Bingo is for entertainment purposes only. Outcomes are decided by community voting.
        </p>
      </div>

      <ShareSheet 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        prediction={prediction}
        user={currentUser}
      />
    </div>
  );
};

export default PredictionDetailView;
