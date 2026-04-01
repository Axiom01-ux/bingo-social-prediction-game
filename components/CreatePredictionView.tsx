
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";

interface CreatePredictionViewProps {
  onBack: () => void;
  onCreate: (data: { title: string; authorComment: string; deadline: string; category: string }) => void;
}

const TEMPLATES = [
  { title: "Will Bitcoin hit 100k PTS value by March?", category: "Crypto" },
  { title: "Will GPT-5 be released in 2025?", category: "Tech" },
  { title: "Will it rain in London tomorrow?", category: "Weather" },
  { title: "Who will win the next NBA Finals?", category: "Sports" },
  { title: "Will SOL flip ETH in market cap?", category: "Market" }
];

const CreatePredictionView: React.FC<CreatePredictionViewProps> = ({ onBack, onCreate }) => {
  const [title, setTitle] = useState("");
  const [authorComment, setAuthorComment] = useState("");
  const [deadline, setDeadline] = useState("7d");
  const [category, setCategory] = useState("General");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiSuggest = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Suggest one interesting, specific, and timely social prediction question about Crypto, Tech, or Sports. These are for fun and resolved by community vote. Format: { \"question\": \"...\", \"category\": \"...\", \"logic\": \"...\" }. Return raw JSON only.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              category: { type: Type.STRING },
              logic: { type: Type.STRING }
            },
            required: ["question", "category", "logic"]
          }
        }
      });

      let text = response.text || "{}";
      text = text.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
      const data = JSON.parse(text);
      
      if (data.question) {
        setTitle(data.question);
        setCategory(data.category || "General");
        setAuthorComment(data.logic || "");
      }
    } catch (error) {
      console.error("AI Suggest error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!title) return;
    onCreate({ title, authorComment, deadline, category });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white animate-in slide-in-from-bottom duration-300 z-[70] safe-top">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-900 bg-neutral-900/50 sticky top-0 z-10 backdrop-blur-md">
        <button onClick={onBack} className="p-2 text-neutral-400 hover:text-white">
          <i className="fa-solid fa-chevron-left text-xl"></i>
        </button>
        <h1 className="font-bold text-lg">Create Market</h1>
        <button 
          onClick={handleSubmit}
          disabled={!title}
          className="text-emerald-400 font-bold disabled:opacity-30"
        >
          Launch
        </button>
      </div>

      <div className="p-6 space-y-8 pb-32">
        <div className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-2xl mb-4">
          <p className="text-[11px] text-brand-400 font-bold uppercase tracking-widest mb-1">
            <i className="fa-solid fa-circle-info mr-1.5"></i>
            Community Resolution
          </p>
          <p className="text-[12px] text-neutral-400 leading-relaxed">
            Markets are resolved by community voting, not external data. Bingo is for entertainment purposes only.
          </p>
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
             <div className="flex justify-between items-center ml-1">
               <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Market Question</label>
               <button 
                 onClick={handleAiSuggest}
                 disabled={isGenerating}
                 className={`text-[10px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-transform ${isGenerating ? 'animate-pulse' : ''}`}
               >
                 <i className={`fa-solid ${isGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                 {isGenerating ? 'Thinking...' : 'AI Suggest'}
               </button>
             </div>
             <textarea 
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               placeholder="What event are you predicting?"
               className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-brand-500 transition-colors min-h-[100px] resize-none"
             />
          </section>

          <section className="space-y-3">
             <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Your Logic (Optional)</label>
             <textarea 
               value={authorComment}
               onChange={(e) => setAuthorComment(e.target.value)}
               placeholder="Why do you think so?"
               className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors min-h-[80px] resize-none"
             />
          </section>
        </div>

        <section className="space-y-4">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Or use a template</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTitle(tmpl.title);
                  setCategory(tmpl.category);
                }}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-4 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
              >
                {tmpl.title}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Deadline</label>
          <div className="grid grid-cols-4 gap-2">
            {['24h', '7d', '30d', 'custom'].map((opt) => (
              <button
                key={opt}
                onClick={() => setDeadline(opt)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  deadline === opt ? 'bg-brand-600 text-white' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                }`}
              >
                {opt.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">Category</label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['Crypto', 'Tech', 'Politics', 'Sports', 'Entertainment', 'Economy'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  category === cat ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-6 bg-gradient-to-t from-neutral-950 to-transparent">
        <button
          onClick={handleSubmit}
          disabled={!title}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
        >
          Create Market
        </button>
        <p className="text-center text-[10px] text-neutral-600 mt-3">
          By creating a market, you agree to Bingo's social guidelines.
        </p>
      </div>
    </div>
  );
};

export default CreatePredictionView;
