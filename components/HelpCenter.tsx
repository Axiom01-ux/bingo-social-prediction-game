
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FAQ } from '../types';
import { db, collection, getDocs, query, orderBy } from '../firebase';

const HelpCenter: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        const faqData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FAQ[];
        
        if (faqData.length === 0) {
          // Fallback static FAQs if collection is empty
          setFaqs([
            {
              id: '1',
              question: 'What is Bingo?',
              answer: 'Bingo is a social prediction game where users express opinions on future events. It is designed strictly for social entertainment and community interaction.',
              category: 'Basics',
              order: 1
            },
            {
              id: '2',
              question: 'Is real money involved?',
              answer: 'No. This application is designed for entertainment purposes only and does not involve real-money gambling. Points are virtual, have no monetary value, and cannot be redeemed for cash, cryptocurrency, or any real-world assets.',
              category: 'Compliance',
              order: 2
            },
            {
              id: '3',
              question: 'How are results settled?',
              answer: 'Outcomes are determined by community voting and are intended for entertainment purposes only. Results are settled through a decentralized community consensus process.',
              category: 'Rules',
              order: 3
            },
            {
              id: '4',
              question: 'How do I participate?',
              answer: 'Users participate by allocating virtual points to express their predictions on future events. This is a social poll and opinion challenge platform.',
              category: 'Rules',
              order: 4
            },
            {
              id: '5',
              question: 'What happens if a market is invalid?',
              answer: 'If a market is deemed ambiguous or invalid by the community, all virtual points (PTS) allocated are fully refunded to the participants\' balances.',
              category: 'Rules',
              order: 5
            }
          ]);
        } else {
          setFaqs(faqData);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const categories = ['All', ...Array.from(new Set(faqs.map(f => f.category)))];
  const filteredFaqs = activeCategory === 'All' ? faqs : faqs.filter(f => f.category === activeCategory);

  return (
    <div className="max-w-2xl mx-auto p-6 pb-24">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Help Center</h1>
        <p className="text-neutral-500 text-sm italic">Social prediction rules and virtual points participation guidelines.</p>
      </div>

      <div className="flex gap-2 mb-10 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeCategory === cat 
                ? 'bg-white text-black shadow-lg shadow-white/10' 
                : 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <div 
              key={faq.id}
              className="bg-neutral-900/50 border border-neutral-800 rounded-[24px] overflow-hidden transition-all hover:border-neutral-700"
            >
              <button
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                className="w-full p-6 flex items-center justify-between text-left group"
              >
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{faq.question}</span>
                <i className={`fa-solid fa-chevron-down text-[10px] text-neutral-600 transition-transform duration-300 ${expandedId === faq.id ? 'rotate-180 text-orange-400' : ''}`}></i>
              </button>
              
              <AnimatePresence>
                {expandedId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 text-xs text-neutral-400 leading-relaxed border-t border-neutral-800/50 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      <div className="mt-16 p-8 rounded-[32px] bg-gradient-to-br from-neutral-900 to-black border border-neutral-800 text-center">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white mx-auto mb-4">
          <i className="fa-solid fa-headset"></i>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Still have questions?</h3>
        <p className="text-xs text-neutral-500 mb-6">Our support team is available 24/7 to help you with any issues.</p>
        <button className="px-8 py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl hover:scale-105 transition-all active:scale-95">
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default HelpCenter;
