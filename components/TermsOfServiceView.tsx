
import React from 'react';

interface TermsOfServiceViewProps {
  onBack: () => void;
}

const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 animate-in fade-in duration-300 safe-top">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Terms of Service</h1>
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 text-neutral-400 hover:text-white transition-colors">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        <section className="bg-neutral-900/50 p-8 rounded-[32px] border border-neutral-800 shadow-xl">
          <h2 className="text-xl font-black mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white text-sm">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            Disclaimer & Product Description
          </h2>
          
          <div className="space-y-6 text-neutral-400 text-sm leading-relaxed font-medium">
            <p className="text-white font-bold">
              This application is a social prediction game designed for entertainment purposes only. Users participate by expressing their opinions on future events through interactive polls.
            </p>
            
            <p>
              The platform uses virtual points that have no monetary value and cannot be exchanged, redeemed, or converted into cash, cryptocurrency, or any other real-world assets.
            </p>
            
            <p>
              All outcomes are determined by community voting and do not reflect real-world event settlements or financial results.
            </p>
            
            <p className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-bold">
              This application does not offer, facilitate, or promote gambling, betting, or any form of financial trading.
            </p>
          </div>
        </section>

        <section className="space-y-4 px-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500">Additional Terms</h3>
          <ul className="space-y-3 text-xs text-neutral-500 list-disc pl-4">
            <li>Users must be of legal age in their jurisdiction to use this social application.</li>
            <li>We reserve the right to moderate content that violates our community guidelines.</li>
            <li>Virtual points are provided for gameplay and have no real-world value.</li>
            <li>Community voting results are final and intended for entertainment only.</li>
          </ul>
        </section>
      </div>

      <div className="h-32"></div>
    </div>
  );
};

export default TermsOfServiceView;
