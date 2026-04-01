
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate?: () => Date;
}

export interface Prediction {
  id: string;
  creator: {
    uid: string;
    name: string;
    handle: string;
    avatar: string;
  };
  creatorUid: string; // Root level creator UID for easier querying/rewards
  authorComment?: string;
  question: string;
  description: string;
  prices: {
    yes: number;
    no: number;
  };
  totalYes: number; // Total amount allocated to YES for bonding curve
  totalNo: number; // Total amount allocated to NO for bonding curve
  volume: number;
  endTime: string | FirestoreTimestamp;
  category: string;
  probability: number;
  isResolved?: boolean;
  isVoting?: boolean; // New: indicates if the prediction is in the voting phase
  votesYes?: number; // New: count of community votes for YES
  votesNo?: number; // New: count of community votes for NO
  voters?: string[]; // New: list of UIDs who have voted
  result?: 'yes' | 'no';
  resolutionSource?: 'community_vote'; // Updated: explicitly mention community vote
  resolutionTime?: string | FirestoreTimestamp;
  resolvedAt?: string | FirestoreTimestamp;
  likesCount?: number;
  repostsCount?: number;
  commentsCount?: number;
  viewsCount?: number;
  createdAt?: string | FirestoreTimestamp;
}

export interface PredictionVote {
  id: string;
  predictionId: string;
  uid: string;
  vote: 'yes' | 'no';
  timestamp: string | FirestoreTimestamp;
}

export interface Report {
  id?: string;
  targetId: string;
  targetType: 'prediction' | 'comment';
  reporterUid: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved';
  timestamp: string | FirestoreTimestamp;
}

export interface Dispute {
  id?: string;
  predictionId: string;
  uid: string;
  category: 'result_error' | 'not_published' | 'misleading' | 'other';
  reason: string;
  evidenceUrl?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  adminResponse?: string;
  timestamp: string | FirestoreTimestamp;
}

export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category: string;
  order?: number;
}

export interface UserPosition {
  id?: string;
  uid: string;
  predictionId: string;
  side: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  referrerUid?: string; // The user who referred this prediction
  isSettled?: boolean; // Whether the points have been distributed
  rewardAmount?: number; // The amount distributed to the participant in virtual points
  timestamp: string | FirestoreTimestamp;
}

export interface Comment {
  id: string;
  user: string;
  uid: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  predictionId: string;
  positionSide?: 'yes' | 'no'; // Show if the commenter has a position
  positionAmount?: number;
}

export interface BingoUser {
  uid: string;
  name: string;
  handle: string;
  avatar: string;
  volume: number;
  balance: number; // Represents virtual points
  role?: string;
  followers?: number;
  following?: number;
  joinedDate?: string;
  wins?: number;
  totalPredictions?: number;
  email?: string;
}

export enum ViewType {
  HOME = 'home',
  EXPLORE = 'explore',
  PORTFOLIO = 'portfolio',
  NOTIFICATIONS = 'notifications',
  PROFILE = 'profile',
  CREATE_PREDICTION = 'create_prediction',
  FRIENDS = 'friends',
  POINTS = 'points',
  LEADERBOARD = 'leaderboard',
  HELP_CENTER = 'help_center',
  DISPUTE_MANAGEMENT = 'dispute_management',
  TERMS_OF_SERVICE = 'terms_of_service'
}

export interface PolymarketMarket {
  question: string;
  description?: string;
  outcomes?: string[];
  outcomePrices?: string[];
  volume?: string;
  endDate?: string;
  category?: string;
}
