
import React, { useState } from 'react';
import { motion } from 'motion/react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: 'result_error' | 'not_published' | 'misleading' | 'other', reason: string, evidenceUrl: string) => void;
  predictionQuestion: string;
}

const DisputeModal: React.FC<DisputeModalProps> = ({ isOpen, onClose, onSubmit, predictionQuestion }) => {
  const [category, setCategory] = useState<'result_error' | 'not_published' | 'misleading' | 'other'>('result_error');
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'result_error', label: 'Result Error', icon: 'fa-circle-xmark' },
    { id: 'not_published', label: 'Not Published', icon: 'fa-clock' },
    { id: 'misleading', label: 'Misleading', icon: 'fa-triangle-exclamation' },
    { id: 'other', label: 'Other', icon: 'fa-ellipsis' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-neutral-900 rounded-[32px] p-8 border border-neutral-800 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400 mx-auto mb-4 border border-orange-500/30">
            <i className="fa-solid fa-gavel text-2xl"></i>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Dispute Result</h2>
          <p className="text-neutral-500 text-sm italic">"{predictionQuestion}"</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3 block">Category</label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id as 'result_error' | 'not_published' | 'misleading' | 'other')}
                  className={`py-4 px-4 rounded-2xl border flex items-center gap-3 transition-all ${
                    category === cat.id 
                      ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-900/20' 
                      : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <i className={`fa-solid ${cat.icon} text-sm`}></i>
                  <span className="text-xs font-bold">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3 block">Reasoning</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the result is incorrect..."
              className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors min-h-[120px] resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3 block">Evidence URL (Optional)</label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://official-source.com/result"
              className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-neutral-500 font-bold hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSubmit(category, reason, evidenceUrl)}
            disabled={!reason}
            className="flex-1 py-4 rounded-2xl bg-white text-black font-black disabled:opacity-30 transition-all active:scale-95 shadow-xl shadow-white/5"
          >
            SUBMIT DISPUTE
          </button>
        </div>
        <p className="text-[9px] text-neutral-600 text-center mt-6 uppercase tracking-widest leading-relaxed">
          Disputes must be submitted within 6 hours of resolution. <br/>
          Abuse of the dispute system may lead to account suspension.
        </p>
      </motion.div>
    </div>
  );
};

export default DisputeModal;
