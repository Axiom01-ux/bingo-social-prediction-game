
import React, { useRef } from 'react';
import { Prediction } from '../types';
import { User } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

interface ShareCardModalProps {
  prediction: Prediction;
  onClose: () => void;
  user?: User | null;
}

const ShareCardModal: React.FC<ShareCardModalProps> = ({ prediction, onClose, user }) => {
  const posterRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}?predictionId=${prediction.id}&ref=${user?.uid}`;
  const shareText = `Check out this prediction on Bingo: "${prediction.question}"! Current probability: ${prediction.probability}%. Join me here:`;

  const handleDownloadImage = async () => {
    if (posterRef.current) {
      try {
        const canvas = await html2canvas(posterRef.current, {
          backgroundColor: '#0a0a0a',
          scale: 2,
          logging: false,
          useCORS: true
        });
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `bingo-prediction-${prediction.id}.png`;
        link.click();
      } catch (error) {
        console.error('Error generating image:', error);
      }
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Direct link copied to clipboard!');
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        ref={posterRef}
        style={{ backgroundColor: '#171717', borderColor: '#262626' }}
        className="w-full max-w-sm rounded-[32px] overflow-hidden border shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poster Header */}
        <div style={{ backgroundColor: '#7c3aed' }} className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <span style={{ color: '#7c3aed' }} className="font-black italic">B</span>
             </div>
             <span className="text-white font-black tracking-tight text-xl">Bingo</span>
          </div>
          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }} className="text-[10px] font-bold uppercase tracking-widest">Share Prediction</span>
        </div>

        {/* Card Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <img 
              src={prediction.creator.avatar} 
              alt={prediction.creator.name} 
              style={{ borderColor: '#262626' }}
              className="w-10 h-10 rounded-full border"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="font-bold text-white text-[15px]">{prediction.creator.name}</div>
              <div style={{ color: '#737373' }} className="text-xs">{prediction.creator.handle}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span style={{ color: '#a78bfa' }} className="text-[10px] font-black uppercase tracking-widest">{prediction.category} Market</span>
              <span style={{ color: '#737373' }} className="text-[10px]">Vol: {(prediction.volume / 1000).toFixed(1)}K PTS</span>
            </div>

            <h3 className="text-2xl font-bold leading-tight text-white">
              {prediction.question}
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span style={{ color: '#a1a1aa' }} className="text-[10px] font-bold uppercase">Current Probability</span>
                <span style={{ color: '#8b5cf6' }} className="text-3xl font-black">{prediction.probability}%</span>
              </div>
              <div style={{ backgroundColor: '#262626' }} className="w-full h-2.5 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${prediction.probability}%`, backgroundColor: '#8b5cf6' }} 
                  className="h-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div style={{ backgroundColor: 'rgba(38, 38, 38, 0.5)', borderColor: '#262626' }} className="rounded-2xl p-4 border flex flex-col items-center">
                <span style={{ color: '#10b981' }} className="font-black text-lg">YES</span>
                <span style={{ color: '#737373' }} className="text-xs">{prediction.prices.yes.toFixed(2)} PTS</span>
              </div>
              <div style={{ backgroundColor: 'rgba(38, 38, 38, 0.5)', borderColor: '#262626' }} className="rounded-2xl p-4 border flex flex-col items-center">
                <span style={{ color: '#a1a1aa' }} className="font-black text-lg">NO</span>
                <span style={{ color: '#737373' }} className="text-xs">{prediction.prices.no.toFixed(2)} PTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with QR */}
        <div style={{ backgroundColor: '#0a0a0a', borderTopColor: '#262626' }} className="p-6 border-t flex items-center justify-between">
           <div className="space-y-1">
             <p className="text-white text-xs font-bold">Join the prediction</p>
             <p style={{ color: '#737373' }} className="text-[10px]">Bingo App: Your social prediction hub</p>
           </div>
           <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center">
              <QRCodeSVG 
                value={shareUrl}
                size={40}
                level="L"
                includeMargin={false}
              />
           </div>
        </div>
      </div>

      {/* Action Buttons Overlay */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-6">
         <div className="flex justify-center gap-4 px-6">
            <button 
              onClick={onClose}
              className="w-14 h-14 rounded-full bg-neutral-800 text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <button 
              onClick={handleTwitterShare}
              className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform border border-neutral-800"
            >
              <i className="fa-brands fa-x-twitter text-xl"></i>
            </button>
            <button 
              onClick={handleTelegramShare}
              className="w-14 h-14 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform"
            >
              <i className="fa-brands fa-telegram text-xl"></i>
            </button>
            <button 
              onClick={handleCopyLink}
              className="w-14 h-14 rounded-full bg-neutral-800 text-white flex items-center justify-center shadow-xl active:scale-90 transition-transform"
            >
              <i className="fa-solid fa-link text-xl"></i>
            </button>
         </div>
         
         <button 
           onClick={handleDownloadImage}
           className="bg-white text-black font-bold py-3 px-8 rounded-full shadow-xl flex items-center gap-2 active:scale-95 transition-all"
         >
           <i className="fa-solid fa-download"></i>
           Save Poster to Share
         </button>
      </div>
    </div>
  );
};

export default ShareCardModal;
