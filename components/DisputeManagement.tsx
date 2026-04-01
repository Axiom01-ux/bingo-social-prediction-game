import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Dispute, Prediction } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const DisputeManagement: React.FC = () => {
  const [disputes, setDisputes] = useState<(Dispute & { id: string })[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'rejected'>('pending');

  useEffect(() => {
    const q = query(collection(db, 'disputes'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const disputeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Dispute & { id: string })[];
      setDisputes(disputeData);
      setLoading(false);

      // Fetch related predictions
      const predIds = Array.from(new Set(disputeData.map(d => d.predictionId)));
      predIds.forEach(id => {
        if (!predictions[id]) {
          const predRef = doc(db, 'predictions', id);
          onSnapshot(predRef, (doc) => {
            if (doc.exists()) {
              setPredictions(prev => ({ ...prev, [id]: { id: doc.id, ...doc.data() } as Prediction }));
            }
          });
        }
      });
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (disputeId: string, status: 'resolved' | 'rejected', adminResponse: string) => {
    try {
      const disputeRef = doc(db, 'disputes', disputeId);
      await updateDoc(disputeRef, {
        status,
        adminResponse,
        resolvedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating dispute:", error);
    }
  };

  const filteredDisputes = disputes.filter(d => d.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-white italic">Dispute Management</h1>
        <div className="flex bg-neutral-900 rounded-xl p-1">
          {(['pending', 'resolved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === s ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' : 'text-neutral-500 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredDisputes.map((dispute) => {
            const prediction = predictions[dispute.predictionId];
            return (
              <motion.div
                key={dispute.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900/50 border border-neutral-800 rounded-[32px] p-6 overflow-hidden relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 bg-brand-400/10 px-2 py-1 rounded-full mb-2 inline-block">
                      {dispute.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-bold text-white leading-tight">
                      {prediction?.question || 'Loading prediction...'}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-neutral-500">
                      {dispute.timestamp?.toDate?.()?.toLocaleString() || 'Recent'}
                    </p>
                    <p className="text-xs font-bold text-neutral-400 mt-1">UID: {dispute.uid.slice(0, 8)}...</p>
                  </div>
                </div>

                <div className="bg-neutral-950/50 rounded-2xl p-4 mb-4 border border-neutral-800/50">
                  <p className="text-sm text-neutral-300 italic">"{dispute.reason}"</p>
                  {dispute.evidenceUrl && (
                    <a 
                      href={dispute.evidenceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 text-xs text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <i className="fa-solid fa-link"></i>
                      View Evidence
                    </a>
                  )}
                </div>

                {dispute.status === 'pending' ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const response = prompt("Enter admin response (optional):");
                        handleAction(dispute.id, 'resolved', response || 'Dispute resolved by admin.');
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                    >
                      Resolve (Accept)
                    </button>
                    <button
                      onClick={() => {
                        const response = prompt("Enter reason for rejection:");
                        if (response) handleAction(dispute.id, 'rejected', response);
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-neutral-800">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Admin Response</p>
                    <p className="text-sm text-neutral-400">{dispute.adminResponse || 'No response provided.'}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredDisputes.length === 0 && (
          <div className="text-center py-20 bg-neutral-900/20 rounded-[40px] border border-dashed border-neutral-800">
            <i className="fa-solid fa-check-circle text-neutral-800 text-4xl mb-4"></i>
            <p className="text-neutral-500 font-medium">No {filter} disputes found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeManagement;
