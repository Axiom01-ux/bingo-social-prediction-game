
import { Prediction } from './types';

export const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: '1',
    creator: {
      name: 'Pika',
      handle: '@hggkg16',
      avatar: 'https://picsum.photos/seed/pika/100/100'
    },
    authorComment: 'Will Bitcoin reach $100,000 before March 2025?',
    question: 'Will Bitcoin reach $100,000 before March 2025?',
    description: 'Based on current market trends and institutional inflows.',
    prices: { yes: 0.65, no: 0.35 },
    volume: 1250400,
    endTime: '2025-03-01',
    category: 'Crypto',
    probability: 65
  },
  {
    id: '2',
    creator: {
      name: 'Micro Panda',
      handle: '@vvm469',
      avatar: 'https://picsum.photos/seed/panda/100/100'
    },
    authorComment: 'Will Luffa Chain launch its Mainnet in Q1?',
    question: 'Will Luffa Chain launch its Mainnet in Q1?',
    description: 'Development roadmap suggests a major update is imminent.',
    prices: { yes: 0.42, no: 0.58 },
    volume: 85000,
    endTime: '2025-03-31',
    category: 'Tech',
    probability: 42
  },
  {
    id: '3',
    creator: {
      name: 'Solana Ecosystem',
      handle: '@solana',
      avatar: 'https://picsum.photos/seed/sol/100/100'
    },
    authorComment: 'Many are predicting a flip. What do you think about the SOL/ETH pair dynamics this quarter?',
    question: 'Will SOL flip ETH in market cap this year?',
    description: 'Comparative analysis of ecosystem growth and TVL.',
    prices: { yes: 0.12, no: 0.88 },
    volume: 4500000,
    endTime: '2025-12-31',
    category: 'Market',
    probability: 12
  }
];
