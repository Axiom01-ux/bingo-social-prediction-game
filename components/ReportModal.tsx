
import React, { useState } from 'react';
import { motion } from 'motion/react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  targetType: 'prediction' | 'comment';
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, targetType }) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-neutral-900 rounded-[32px] p-6 border border-neutral-800 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 mx-auto mb-4 border border-red-500/30">
            <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Report Content</h2>
          <p className="text-neutral-500 text-sm">Help us keep Bingo fair. Why are you reporting this {targetType}?</p>
        </div>

        <div className="space-y-3 mb-8">
          {[
            'Spam or Scams',
            'Misleading Description',
            'Incorrect Resolution Evidence',
            'Offensive Content',
            'Other'
          ].map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full py-4 px-6 rounded-2xl border text-left text-sm font-bold transition-all ${
                reason === r 
                  ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-900/20' 
                  : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-neutral-500 font-bold hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSubmit(reason)}
            disabled={!reason}
            className="flex-1 py-4 rounded-2xl bg-white text-black font-black disabled:opacity-30 transition-all active:scale-95"
          >
            SUBMIT
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportModal;
