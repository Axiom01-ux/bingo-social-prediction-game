
import React, { useState } from 'react';
import { Prediction } from '../types';

interface PredictionModalProps {
  prediction: Prediction;
  side: 'yes' | 'no';
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const PredictionModal: React.FC<PredictionModalProps> = ({ prediction, side, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>('10');

  const price = side === 'yes' ? prediction.prices.yes : prediction.prices.no;
  const potentialReturn = (parseFloat(amount || '0') / price).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 rounded-t-3xl p-6 shadow-2xl border-t border-neutral-800 animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto mb-6" onClick={onClose}></div>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Confirm Opinion</h2>
            <p className="text-sm text-neutral-400">{prediction.question}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className={`p-4 rounded-2xl mb-6 ${side === 'yes' ? 'bg-brand-900/20 border border-brand-500/30' : 'bg-cyan-900/20 border border-cyan-500/30'}`}>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-neutral-400">Position</span>
            <span className={`font-bold uppercase ${side === 'yes' ? 'text-brand-400' : 'text-cyan-400'}`}>{side}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-neutral-400">Avg. Price</span>
            <span className="text-white font-bold">{price.toFixed(2)} PTS</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
               <label className="text-[10px] text-neutral-500 block mb-1 uppercase tracking-tighter">Allocation (PTS)</label>
               <input 
                 type="number"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-brand-500"
                 placeholder="0"
               />
            </div>
            <div className="flex-1">
               <label className="text-[10px] text-neutral-500 block mb-1 uppercase tracking-tighter">Est. Reward</label>
               <div className="w-full bg-neutral-800 rounded-xl px-4 py-3 text-brand-400 font-bold border border-transparent">
                 {potentialReturn} PTS
               </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onConfirm(parseFloat(amount))}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-brand-600/20 transition-all transform active:scale-95"
        >
          Confirm Prediction
        </button>
        <p className="text-center text-[10px] text-neutral-600 mt-4 px-4">
           Bingo is for entertainment purposes only. PTS have no real-world value.
           Outcomes are decided by community voting.
        </p>
      </div>
    </div>
  );
};

export default PredictionModal;
