
import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { ViewType, Prediction, UserPosition, BingoUser, PolymarketMarket } from './types';
import PredictionCard from './components/PredictionCard';
import PredictionModal from './components/PredictionModal';
import PredictionDetailView from './components/PredictionDetailView';
import CreatePredictionView from './components/CreatePredictionView';
import FriendsView from './components/FriendsView';
import PointsCenterView from './components/PointsCenterView';
import LeaderboardView from './components/LeaderboardView';
import ExploreView from './components/ExploreView';
import SettingsView from './components/SettingsView';
import ShareCardModal from './components/ShareCardModal';
import ResolutionModal from './components/ResolutionModal';
import ReportModal from './components/ReportModal';
import DisputeModal from './components/DisputeModal';
import HelpCenter from './components/HelpCenter';
import DisputeManagement from './components/DisputeManagement';
import TermsOfServiceView from './components/TermsOfServiceView';
import { AIChatWindow } from './components/AIChatWindow';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import { 
  auth, 
  db, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  logOut,
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp,
  increment,
  handleFirestoreError,
  OperationType
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GoogleGenAI } from "@google/genai";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      let errorMessage = "Something went wrong.";
      try {
        const parsedError = JSON.parse(this.state.error.message);
        if (parsedError.error) {
          if (parsedError.error.includes('Quota exceeded')) {
            errorMessage = "Daily Firestore quota exceeded. The free tier limit has been reached. Please try again tomorrow when the quota resets.";
          } else {
            errorMessage = `Firebase Error: ${parsedError.error} (${parsedError.operationType} on ${parsedError.path})`;
          }
        }
      } catch {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Application Error</h1>
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 max-w-lg">
            <p className="mb-4 text-zinc-400">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>(ViewType.HOME);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<{ p: Prediction, side: 'yes' | 'no' } | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<{prediction: Prediction, initialTab?: 'positions' | 'comments'} | null>(null);
  const [sharingPrediction, setSharingPrediction] = useState<Prediction | null>(null);
  const [resolvingPrediction, setResolvingPrediction] = useState<Prediction | null>(null);
  const [disputingPrediction, setDisputingPrediction] = useState<Prediction | null>(null);
  const [reportingTarget, setReportingTarget] = useState<{id: string, type: 'prediction' | 'comment'} | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const isMockUser = useCallback((u: User | null) => u?.uid?.startsWith('local_guest_'), []);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [referrerUid, setReferrerUid] = useState<string | null>(null);
  const [isScouting, setIsScouting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Bookmark state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [repostedIds, setRepostedIds] = useState<Set<string>>(new Set());
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  
  const isAdmin = user?.email === 'lzhao5812@gmail.com';

  // Capture Referrer UID and Prediction ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const predId = params.get('predictionId');
    
    if (ref) {
      setReferrerUid(ref);
    }
    
    // Clean up URL without refreshing
    if (ref || predId) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
    // If we have a predictionId, we'll handle it after predictions are loaded
  }, []);

  // Handle direct prediction link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const predId = params.get('predictionId');
    if (predId && predictions.length > 0) {
      const target = predictions.find(p => p.id === predId);
      if (target) {
        setSelectedDetail({ prediction: target });
      }
    }
  }, [predictions]);
  // Position state (Important: all records after placing an order are here)
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);

  // Current user Mock (Shown when not logged in, real data used after login)
  const [currentUser, setCurrentUser] = useState<BingoUser>({
    uid: '',
    name: 'Bingo User',
    handle: '@bingo',
    avatar: 'https://picsum.photos/seed/bingo/100/100',
    balance: 1000, // Updated to 1000 points
    volume: 0,
    followers: 0,
    following: 0,
    joinedDate: new Date().toISOString()
  });

  const handleLogout = useCallback(async () => {
    try {
      await logOut();
      setUser(null);
      setCurrentUser({
        uid: '',
        name: 'Bingo User',
        handle: '@bingo',
        avatar: 'https://picsum.photos/seed/bingo/100/100',
        balance: 1000, // Updated to 1000 points
        volume: 0,
        followers: 0,
        following: 0,
        joinedDate: new Date().toISOString()
      });
      showToast("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("Failed to logout", "error");
    }
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAuthError("Please enter both email and password");
      return;
    }
    
    setIsAuthLoading(true);
    setAuthError(null);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        showToast("Account created successfully!");
      } else {
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        showToast("Logged in successfully!");
      }
    } catch (error: unknown) {
      console.error("Auth error:", error);
      const authError = error as { code?: string };
      let message = "Authentication failed";
      if (authError.code === 'auth/user-not-found') message = "User not found";
      if (authError.code === 'auth/wrong-password') message = "Incorrect password";
      if (authError.code === 'auth/email-already-in-use') message = "Email already in use";
      if (authError.code === 'auth/invalid-email') message = "Invalid email format";
      if (authError.code === 'auth/weak-password') message = "Password should be at least 6 characters";
      if (authError.code === 'auth/operation-not-allowed') message = "Email/Password auth is not enabled in Firebase Console. Please enable it.";
      
      if (message === "Authentication failed") {
        message = `Authentication failed: ${authError.code || 'Unknown error'}`;
      }
      
      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signInAnonymously(auth);
      showToast("Continuing as Guest");
    } catch (error: unknown) {
      const guestError = error as { code?: string; message?: string };
      console.warn("Firebase Anonymous Auth failed:", guestError.code, guestError.message);
      
      // Fallback to local mock user if anonymous auth is disabled, restricted, or network fails
      if (guestError.code === 'auth/admin-restricted-operation' || 
          guestError.code === 'auth/operation-not-allowed' ||
          guestError.code === 'auth/internal-error' ||
          guestError.code === 'auth/network-request-failed') {
        
        console.info("Using local mock user fallback.");
        const mockUid = `local_guest_${Math.random().toString(36).slice(2, 11)}`;
        const mockUser = {
          uid: mockUid,
          name: 'Guest User (Local)',
          handle: `@guest_${mockUid.slice(-4)}`,
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${mockUid}`,
          balance: 1000, // Updated to 1000 points
          wins: 0,
          totalPredictions: 0,
          volume: 0,
          joinedDate: new Date().toISOString(),
          role: 'user'
        };
        
        // Important: Set currentUser first, then user state
        setCurrentUser(mockUser);
        setUser({ uid: mockUid, isAnonymous: true } as User);
        setIsAuthReady(true); // Ensure app knows auth is ready
        showToast("Guest mode enabled (Local)");
      } else {
        console.error("Guest login failed:", error);
        setAuthError(`Guest login failed: ${guestError.code || 'Unknown error'}`);
        showToast("Guest login failed", "error");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If we already have a mock user set, don't let Firebase null it out
      if (!firebaseUser && user && isMockUser(user)) {
        setIsAuthReady(true);
        return;
      }

      setUser(firebaseUser);
      setIsAuthReady(true);
      
      if (!firebaseUser || isMockUser(firebaseUser)) return;

      // Sync user profile to Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      
      // Real-time sync for current user
      onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setCurrentUser({
            uid: firebaseUser.uid,
            name: data.name || 'Anonymous',
            handle: data.handle || '@user',
            avatar: data.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${firebaseUser.uid}`,
            balance: data.balance || 0,
            volume: data.volume || 0,
            followers: data.followers || 0,
            following: data.following || 0,
            joinedDate: data.joinedDate || new Date().toISOString()
          });
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`));

      try {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          const newUser = {
            uid: firebaseUser.uid,
            name: 'Guest User',
            handle: `@guest_${firebaseUser.uid.slice(0, 6)}`,
            avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${firebaseUser.uid}`,
            balance: 1000,
            wins: 0,
            totalPredictions: 0,
            volume: 0,
            joinedDate: new Date().toISOString(),
            role: 'user'
          };
          await setDoc(userDocRef, newUser);
          setCurrentUser({
            uid: firebaseUser.uid,
            name: newUser.name,
            handle: newUser.handle,
            avatar: newUser.avatar,
            balance: newUser.balance,
            wins: newUser.wins,
            volume: newUser.volume,
            joinedDate: newUser.joinedDate
          });
        } else {
          const data = userDoc.data();
          setCurrentUser({
            uid: firebaseUser.uid,
            name: data.name || 'Guest User',
            handle: data.handle || `@guest_${firebaseUser.uid.slice(0, 6)}`,
            avatar: data.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${firebaseUser.uid}`,
            balance: data.balance || 0,
            wins: data.wins || 0,
            volume: data.volume || 0,
            joinedDate: data.joinedDate || new Date().toISOString()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
      }
    });
    return () => unsubscribe();
  }, [isMockUser, user]);

  // Real-time Predictions
  useEffect(() => {
    const q = query(collection(db, 'predictions'), orderBy('createdAt', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const preds = snapshot.docs.map(doc => {
        const data = doc.data();
        // Fallback for legacy 'odds' field or missing prices
        const prices = data.prices || data.odds || { yes: 0.5, no: 0.5 };
        return { id: doc.id, ...data, prices } as Prediction;
      });
      // If empty, seed with mock data (only for demo purposes)
      if (preds.length === 0 && isAuthReady) {
        // Seed logic could go here if needed
      }
      setPredictions(preds);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'predictions'));
    return () => unsubscribe();
  }, [isAuthReady]);

  // Real-time User Positions
  useEffect(() => {
    if (!user || isMockUser(user)) {
      setTimeout(() => setUserPositions([]), 0);
      return;
    }
    const q = query(collection(db, 'userPositions'), where('uid', '==', user.uid), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const positions = snapshot.docs.map(doc => doc.data() as UserPosition);
      setUserPositions(positions);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'userPositions'));
    return () => unsubscribe();
  }, [user, isMockUser]);

  // Real-time Bookmarks
  useEffect(() => {
    if (!user || isMockUser(user)) {
      setTimeout(() => setBookmarkedIds(new Set()), 0);
      return;
    }
    const q = query(collection(db, 'bookmarks'), where('uid', '==', user.uid), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.data().predictionId));
      setBookmarkedIds(ids);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'bookmarks'));
    return () => unsubscribe();
  }, [user, isMockUser]);

  useEffect(() => {
    if (!user || isMockUser(user)) {
      setTimeout(() => setLikedIds(new Set()), 0);
      return;
    }
    const q = query(collection(db, 'likes'), where('uid', '==', user.uid), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.data().predictionId));
      setLikedIds(ids);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'likes'));
    return () => unsubscribe();
  }, [user, isMockUser]);

  useEffect(() => {
    if (!user || isMockUser(user)) {
      setTimeout(() => setRepostedIds(new Set()), 0);
      return;
    }
    const q = query(collection(db, 'reposts'), where('uid', '==', user.uid), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = new Set(snapshot.docs.map(doc => doc.data().predictionId));
      setRepostedIds(ids);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reposts'));
    return () => unsubscribe();
  }, [user, isMockUser]);

  const handleLike = useCallback(async (predictionId: string) => {
    if (!user || isMockUser(user)) {
      alert('Please log in with a real account to like predictions');
      return;
    }
    const isLiked = likedIds.has(predictionId);
    const likeId = `${user.uid}_${predictionId}`;
    try {
      if (isLiked) {
        await deleteDoc(doc(db, 'likes', likeId));
        await updateDoc(doc(db, 'predictions', predictionId), {
          likesCount: increment(-1)
        });
      } else {
        await setDoc(doc(db, 'likes', likeId), {
          uid: user.uid,
          predictionId,
          timestamp: serverTimestamp()
        });
        await updateDoc(doc(db, 'predictions', predictionId), {
          likesCount: increment(1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'likes');
    }
  }, [user, likedIds, isMockUser]);

  const handleRepost = useCallback(async (predictionId: string) => {
    if (!user || isMockUser(user)) {
      showToast('Please log in with a real account to repost predictions', 'error');
      return;
    }
    const isReposted = repostedIds.has(predictionId);
    const repostId = `${user.uid}_${predictionId}`;
    try {
      if (isReposted) {
        await deleteDoc(doc(db, 'reposts', repostId));
        await updateDoc(doc(db, 'predictions', predictionId), {
          repostsCount: increment(-1)
        });
      } else {
        await setDoc(doc(db, 'reposts', repostId), {
          uid: user.uid,
          predictionId,
          timestamp: serverTimestamp()
        });
        await updateDoc(doc(db, 'predictions', predictionId), {
          repostsCount: increment(1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reposts');
    }
  }, [user, repostedIds, isMockUser]);

  const handleView = useCallback(async (predictionId: string) => {
    if (viewedIds.has(predictionId)) return;
    
    try {
      await updateDoc(doc(db, 'predictions', predictionId), {
        viewsCount: increment(1)
      });
      setViewedIds(prev => new Set(prev).add(predictionId));
    } catch (error) {
      console.error("View count error:", error);
    }
  }, [viewedIds]);

  // Increment view count when a prediction is selected
  useEffect(() => {
    if (selectedDetail?.prediction?.id) {
      handleView(selectedDetail.prediction.id);
    }
  }, [selectedDetail?.prediction?.id, handleView]);

  const handleBookmark = useCallback(async (predictionId: string) => {
    if (!user || isMockUser(user)) {
      showToast('Please log in with a real account to bookmark predictions', 'error');
      return;
    }
    const bookmarkId = `${user.uid}_${predictionId}`;
    const bookmarkRef = doc(db, 'bookmarks', bookmarkId);
    try {
      if (bookmarkedIds.has(predictionId)) {
        await deleteDoc(bookmarkRef);
      } else {
        await setDoc(bookmarkRef, {
          uid: user.uid,
          predictionId,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bookmarks');
    }
  }, [user, bookmarkedIds, isMockUser]);

  
  const handleSearchChange = (q: string) => {
    if (q === 'scout') {
      handleSyncMarkets();
      setGlobalSearchQuery('');
      return;
    }
    setGlobalSearchQuery(q);
    if (activeView !== ViewType.EXPLORE && q.trim() !== '') {
      setActiveView(ViewType.EXPLORE);
    }
  };

  const handleNavClick = (view: ViewType) => {
    if ((view === ViewType.POINTS || view === ViewType.PROFILE || view === ViewType.FRIENDS) && (!user || isMockUser(user))) {
      showToast('Please sign in to access this feature', 'error');
      return;
    }
    setIsFabMenuOpen(false);
    setSelectedDetail(null);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Create prediction logic
  const handleCreatePrediction = async (data: { title: string; authorComment: string; deadline: string; category: string }) => {
    if (!user || isMockUser(user)) {
      showToast('Please log in with a real account to create a prediction', 'error');
      return;
    }

    // Calculate endTime based on deadline string
    let endTimestamp: Timestamp;
    const now = new Date();
    if (data.deadline === '24h') {
      endTimestamp = Timestamp.fromDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    } else if (data.deadline === '7d') {
      endTimestamp = Timestamp.fromDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else if (data.deadline === '30d') {
      endTimestamp = Timestamp.fromDate(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
    } else {
      // Default or custom (simplified for now to 7 days if custom not implemented)
      endTimestamp = Timestamp.fromDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
    }

    const newPrediction = {
      creatorUid: user.uid,
      creator: {
        uid: user.uid,
        name: currentUser.name,
        handle: currentUser.handle,
        avatar: currentUser.avatar
      },
      question: data.title,
      authorComment: data.authorComment,
      description: data.authorComment || "No description provided.",
      prices: { yes: 0.5, no: 0.5 },
      totalYes: 1, // Initial liquidity
      totalNo: 1, // Initial liquidity
      volume: 0,
      endTime: endTimestamp,
      category: data.category || 'General',
      probability: 50,
      isResolved: false,
      createdAt: serverTimestamp()
    };

    try {
      const docRef = doc(collection(db, 'predictions'));
      await setDoc(docRef, newPrediction);
      
      // Ensure state updates correctly
      setActiveView(ViewType.HOME);
      setSelectedDetail({ prediction: { id: docRef.id, ...newPrediction } as Prediction });
      
      // Force scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'predictions');
    }
  };

  // Confirm order logic
  const handleConfirmPrediction = async (amount: number) => {
    if (!selectedPrediction || !user || isMockUser(user)) {
      if (isMockUser(user)) showToast('Please log in with a real account to make predictions', 'error');
      return;
    }

    // Bonding Curve Logic:
    // Probability = totalYes / (totalYes + totalNo)
    const currentTotalYes = selectedPrediction.p.totalYes || 1;
    const currentTotalNo = selectedPrediction.p.totalNo || 1;
    
    let newTotalYes = currentTotalYes;
    let newTotalNo = currentTotalNo;
    
    if (selectedPrediction.side === 'yes') {
      newTotalYes += amount;
    } else {
      newTotalNo += amount;
    }

    const newProbability = (newTotalYes / (newTotalYes + newTotalNo)) * 100;
    const newPriceYes = newTotalYes / (newTotalYes + newTotalNo);
    const newPriceNo = newTotalNo / (newTotalYes + newTotalNo);

    const newPosition = {
      uid: user.uid,
      predictionId: selectedPrediction.p.id,
      side: selectedPrediction.side,
      shares: amount / (selectedPrediction.side === 'yes' ? newPriceYes : newPriceNo),
      avgPrice: selectedPrediction.side === 'yes' ? newPriceYes : newPriceNo,
      referrerUid: referrerUid || undefined,
      isSettled: false,
      timestamp: serverTimestamp()
    };

    try {
      // 1. Record position
      await setDoc(doc(collection(db, 'userPositions')), newPosition);
      
      // 2. Update prediction with Bonding Curve results
      const predRef = doc(db, 'predictions', selectedPrediction.p.id);
      await updateDoc(predRef, {
        volume: selectedPrediction.p.volume + amount,
        totalYes: newTotalYes,
        totalNo: newTotalNo,
        probability: Math.round(newProbability),
        prices: {
          yes: newPriceYes,
          no: newPriceNo
        }
      });

      // 3. Update user balance and stats
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        await updateDoc(userRef, {
          balance: (userData.balance || 0) - amount,
          totalPredictions: (userData.totalPredictions || 0) + 1,
          totalVolume: (userData.totalVolume || 0) + amount
        });
      }

      setSelectedPrediction(null);
      alert(`🎉 Order successful! Bought ${newPosition.shares.toFixed(2)} shares`);
      setActiveView(ViewType.POINTS);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'userPositions');
    }
  };

  const handleReport = async (reason: string) => {
    if (!user || !reportingTarget) return;
    try {
      await addDoc(collection(db, 'reports'), {
        targetId: reportingTarget.id,
        targetType: reportingTarget.type,
        reporterUid: user.uid,
        reason,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      showToast("Report submitted. Our team will review it.");
      setReportingTarget(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
    }
  };

  const handleDispute = async (category: 'result_error' | 'not_published' | 'misleading' | 'other', reason: string, evidenceUrl: string) => {
    if (!user || !disputingPrediction) return;
    try {
      await addDoc(collection(db, 'disputes'), {
        predictionId: disputingPrediction.id,
        uid: user.uid,
        category,
        reason,
        evidenceUrl,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      showToast("Dispute submitted. Our team will review it within 24 hours.");
      setDisputingPrediction(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'disputes');
    }
  };

  const handleSyncMarkets = useCallback(async () => {
    if (!user || isScouting) return;
    
    setIsScouting(true);
    try {
      // Fetch from local proxy API to avoid CORS
      const proxyUrl = `${window.location.origin}/api/polymarket`;
      console.log("Fetching from proxy:", proxyUrl);
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      
      const markets = await response.json();
      
      // Filter for binary markets (Yes/No) and take top 4
      const binaryMarkets = (markets as PolymarketMarket[]).filter((m) => 
        m.outcomes && 
        m.outcomes.length === 2 && 
        (m.outcomes.includes("Yes") || m.outcomes.includes("No")) &&
        m.question &&
        m.outcomePrices
      ).slice(0, 4);

      if (binaryMarkets.length === 0) {
        throw new Error("No suitable binary markets found on Polymarket.");
      }

      for (const market of binaryMarkets) {
        // Check if this market already exists to avoid duplicates
        const existingQuery = query(collection(db, 'predictions'), where('question', '==', market.question));
        const existingDocs = await getDocs(existingQuery);
        
        if (existingDocs.empty) {
          const prob = parseFloat(market.outcomePrices[0]);
          const endTimestamp = market.endDate 
            ? Timestamp.fromDate(new Date(market.endDate))
            : Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

          const newPrediction = {
            creatorUid: "system",
            creator: {
              uid: "system",
              name: "Polymarket",
              handle: "@polymarket",
              avatar: "https://polymarket.com/favicon.ico"
            },
            question: market.question,
            authorComment: market.description || "Imported from Polymarket",
            description: market.description || market.question,
            prices: { 
              yes: prob, 
              no: 1 - prob 
            },
            totalYes: prob * 100,
            totalNo: (1 - prob) * 100,
            volume: market.volume ? parseFloat(market.volume) : 0,
            endTime: endTimestamp,
            category: market.category || 'General',
            probability: Math.round(prob * 100),
            isResolved: false,
            createdAt: serverTimestamp()
          };
          await setDoc(doc(collection(db, 'predictions')), newPrediction);
        }
      }
      showToast(`Imported ${binaryMarkets.length} hot markets from Polymarket!`);
    } catch (error) {
      console.error("Scout error:", error);
      showToast(error instanceof Error ? error.message : "Failed to import Polymarket markets.", "error");
    } finally {
      setIsScouting(false);
    }
  }, [user, isScouting]);

  // Auto-sync Polymarket for admin if empty
  useEffect(() => {
    if (isAdmin && isAuthReady && predictions.length > 0) {
      const hasSystemPreds = predictions.some(p => p.creatorUid === 'system');
      if (!hasSystemPreds && !isScouting) {
        handleSyncMarkets();
      }
    }
  }, [isAdmin, isAuthReady, predictions, isScouting, handleSyncMarkets]);

  const handleGenerateVideo = async (prediction: Prediction) => {
    if (!user) {
      showToast("Please login to generate videos", "error");
      return;
    }

    try {
      // Check for API key selection as required for Veo models
      if (typeof window.aistudio !== 'undefined') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
          // Proceed after opening dialog as per guidelines
        }
      }

      setGeneratedVideoUrl(null);
      setIsVideoModalOpen(true);

      // Create a fresh instance to ensure up-to-date API key
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Create a high-energy, cinematic news-style video summary for this prediction market: "${prediction.question}". 
      Context: ${prediction.description || prediction.authorComment || 'A social prediction market'}. 
      Current Probability: ${prediction.probability}% for YES. 
      The video should feel like a breaking news segment with dynamic graphics and an authoritative tone.`;

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      // Poll for completion
      let attempts = 0;
      while (!operation.done && attempts < 60) { // Max 5 minutes
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
        attempts++;
      }

      if (operation.done && operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        const apiKey = process.env.GEMINI_API_KEY;
        
        // Fetch the video with the API key header
        const videoResponse = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey || '',
          },
        });
        
        if (!videoResponse.ok) throw new Error("Failed to download generated video");
        
        const blob = await videoResponse.blob();
        const url = URL.createObjectURL(blob);
        setGeneratedVideoUrl(url);
      } else {
        throw new Error("Video generation timed out or failed");
      }
    } catch (error) {
      console.error("Video generation error:", error);
      // Handle "Requested entity was not found" by prompting for key again
      if (error instanceof Error && error.message.includes("not found")) {
        showToast("API Key issue. Please select your key again.", "error");
        if (typeof window.aistudio !== 'undefined') await window.aistudio.openSelectKey();
      } else {
        showToast("Failed to generate video. Please try again.", "error");
      }
      setIsVideoModalOpen(false);
    } finally {
      // Done
    }
  };

  const handleVote = async (predictionId: string, vote: 'yes' | 'no') => {
    if (!user) {
      showToast("Please login to vote", "error");
      return;
    }
    
    try {
      const predRef = doc(db, 'predictions', predictionId);
      const prediction = predictions.find(p => p.id === predictionId);
      if (!prediction || !prediction.isVoting) return;
      
      if (prediction.voters?.includes(user.uid)) {
        showToast("You have already voted", "error");
        return;
      }
      
      const updateData: { voters: string[]; votesYes?: number; votesNo?: number } = {
        voters: [...(prediction.voters || []), user.uid]
      };
      
      if (vote === 'yes') {
        updateData.votesYes = (prediction.votesYes || 0) + 1;
      } else {
        updateData.votesNo = (prediction.votesNo || 0) + 1;
      }
      
      await updateDoc(predRef, updateData);
      showToast("Vote cast successfully!");
    } catch (error) {
      console.error("Error casting vote:", error);
      showToast("Failed to cast vote", "error");
    }
  };

  const handleStartVoting = async (predictionId: string) => {
    if (!user) return;
    try {
      const predRef = doc(db, 'predictions', predictionId);
      await updateDoc(predRef, {
        isVoting: true,
        votesYes: 0,
        votesNo: 0,
        voters: []
      });
      showToast("Voting has started!");
    } catch (error) {
      console.error("Error starting voting:", error);
      showToast("Failed to start voting", "error");
    }
  };

  const handleResolvePrediction = async (predictionId: string, result: 'yes' | 'no') => {
    if (!user) return;
    try {
      const predRef = doc(db, 'predictions', predictionId);
      const prediction = predictions.find(p => p.id === predictionId);
      if (!prediction) return;

      // 1. Update prediction status
      await updateDoc(predRef, {
        isResolved: true,
        isVoting: false,
        result,
        resolvedAt: serverTimestamp(),
        resolutionSource: 'community_vote',
        resolutionTime: serverTimestamp(),
        probability: result === 'yes' ? 100 : 0
      });

      // 2. Process Rewards (95:2:3 Mechanism)
      // 95% Winner, 2% Platform, 1.5% Creator, 1.5% Promoter
      const positionsRef = collection(db, 'userPositions');
      const q = query(positionsRef, where('predictionId', '==', predictionId), where('isSettled', '==', false));
      
      const positionsSnapshot = await getDocs(q);

      for (const posDoc of positionsSnapshot.docs) {
        const pos = posDoc.data() as UserPosition;
        if (pos.side === result) {
          // Winner!
          const totalReward = pos.shares * 1.0; // Each winning share is worth 1 Point
          const winnerShare = totalReward * 0.95;
          const creatorShare = totalReward * 0.015;
          const promoterShare = totalReward * 0.015;

          // Update Winner Balance and Wins
          const winnerRef = doc(db, 'users', pos.uid);
          const winnerDoc = await getDoc(winnerRef);
          if (winnerDoc.exists()) {
            const winnerData = winnerDoc.data();
            await updateDoc(winnerRef, {
              balance: (winnerData.balance || 0) + winnerShare,
              wins: (winnerData.wins || 0) + 1
            });
          }

          // Update Creator Balance
          const creatorRef = doc(db, 'users', prediction.creatorUid);
          const creatorDoc = await getDoc(creatorRef);
          if (creatorDoc.exists()) {
            await updateDoc(creatorRef, {
              balance: (creatorDoc.data().balance || 0) + creatorShare
            });
          }

          // Update Promoter Balance (if exists)
          if (pos.referrerUid) {
            const promoterRef = doc(db, 'users', pos.referrerUid);
            const promoterDoc = await getDoc(promoterRef);
            if (promoterDoc.exists()) {
              await updateDoc(promoterRef, {
                balance: (promoterDoc.data().balance || 0) + promoterShare
              });
            }
          }

          // Mark position as paid
          await updateDoc(doc(db, 'userPositions', posDoc.id), {
            isSettled: true,
            rewardAmount: winnerShare
          });
        } else {
          // Loser - just mark as settled (0 reward)
          await updateDoc(doc(db, 'userPositions', posDoc.id), {
            isSettled: true,
            rewardAmount: 0
          });
        }
      }

      setResolvingPrediction(null);
      if (selectedDetail?.prediction.id === predictionId) {
        setSelectedDetail(prev => prev ? { ...prev, prediction: { ...prev.prediction, isResolved: true, result, probability: result === 'yes' ? 100 : 0 } } : null);
      }
      
      showToast(`Market resolved as ${result.toUpperCase()}!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `predictions/${predictionId}`);
    }
  };

  // Wallet logic removed as per user request
  // Wallet Event Listeners removed
  useEffect(() => {
    // No-op
  }, []);

  const renderAIActionBar = () => {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: [0, -15, 0],
          rotate: [0, 1, -1, 0]
        }}
        transition={{
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 }
        }}
        className="fixed bottom-24 right-6 lg:absolute lg:right-0 lg:translate-x-1/2 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 z-[60] flex flex-col gap-6 items-center"
      >
        <div className="relative group">
          <button 
            onClick={(e) => { e.stopPropagation(); setIsAIChatOpen(true); }}
            className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.6)] hover:scale-110 active:scale-95 transition-all border border-brand-400/30 relative overflow-hidden"
            title="AI Assistant"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-600 to-brand-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <i className="fa-solid fa-robot text-xl relative z-10"></i>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-neutral-950 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </button>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 bg-neutral-950/80 px-2 py-1 rounded-md border border-brand-500/20">AI Assistant</span>
          </div>
        </div>
        
        <div className="relative group">
          <button 
            onClick={(e) => { e.stopPropagation(); setActiveView(ViewType.CREATE_PREDICTION); }}
            className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] hover:scale-110 active:scale-95 transition-all border border-brand-400/30"
            title="Create Market"
          >
            <i className="fa-solid fa-plus text-xl group-hover:rotate-90 transition-transform"></i>
          </button>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 bg-neutral-950/80 px-2 py-1 rounded-md border border-brand-500/20">Create</span>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderHome = () => {
    const hotPredictions = predictions.filter(p => p.creatorUid === 'system').slice(0, 2);
    const personalPredictions = user ? predictions.filter(p => p.creatorUid === user.uid) : [];
    const isLoggedIn = user && !isMockUser(user);

    return (
      <div className="pb-24 md:pb-0">
        {/* Top Status Bar - Mobile Only */}
        <div className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-xl pt-4 pb-2 px-6 flex items-center justify-between border-b border-neutral-900/50 safe-top md:hidden">
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <div 
                  className="w-8 h-8 rounded-full overflow-hidden border border-neutral-800 cursor-pointer active:scale-90 transition-transform"
                  onClick={() => handleNavClick(ViewType.PROFILE)}
                >
                  <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div 
                  onClick={() => handleNavClick(ViewType.POINTS)}
                  className="bg-brand-600 px-3 py-1 rounded-full flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer shadow-lg shadow-brand-600/20"
                >
                  <span className="text-white font-black text-[13px] tracking-tight">{Math.floor(currentUser.balance)} PTS</span>
                  <i className="fa-solid fa-plus text-[8px] text-brand-200 bg-brand-700 p-0.5 rounded-sm"></i>
                </div>
              </>
            ) : (
              <button 
                onClick={() => {
                  // On mobile, we might need a modal or a dedicated auth view
                  // For now, let's just show a toast or redirect to a simple auth view if we had one
                  showToast('Please use the desktop version to sign in, or we can add a mobile login soon!', 'error');
                }}
                className="bg-brand-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest active:scale-95 transition-transform"
              >
                Sign In
              </button>
            )}
          </div>
          <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="flex items-center gap-1">
              <i className="fa-solid fa-bolt text-brand-500 text-xl"></i>
              <span className="text-2xl font-black tracking-tight text-brand-500">Bingo</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={handleSyncMarkets}
                disabled={isScouting}
                className={`w-8 h-8 flex items-center justify-center rounded-full bg-brand-600/20 text-brand-400 border border-brand-500/30 active:scale-90 transition-transform ${isScouting ? 'animate-pulse opacity-50' : ''}`}
              >
                <i className={`fa-solid ${isScouting ? 'fa-spinner fa-spin' : 'fa-sync'} text-xs`}></i>
              </button>
            )}
          </div>
        </div>

        {/* Desktop Header - Removed as per user request */}

        {/* Hot Markets Section */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg font-normal text-white italic flex items-center gap-2">
              <i className="fa-solid fa-fire text-brand-600 animate-pulse"></i>
              Hot Markets
            </h2>
            <div className="flex items-center gap-3">
              {/* Balance Display - Moved from top header */}
              <div 
                onClick={() => setActiveView(ViewType.POINTS)}
                className="hidden md:flex items-center gap-2 bg-brand-600 px-3 py-1.5 rounded-full cursor-pointer hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
              >
                <span className="text-white font-black text-xs">{Math.floor(currentUser.balance)} PTS</span>
                <i className="fa-solid fa-circle-plus text-brand-200 text-[10px]"></i>
              </div>
              
              {isAdmin && (
                <button 
                  onClick={handleSyncMarkets} 
                  disabled={isScouting}
                  className={`text-[10px] font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 px-3 py-1.5 rounded-full border border-brand-500/20 active:scale-95 transition-transform flex items-center gap-2 ${isScouting ? 'opacity-50' : ''}`}
                >
                  {isScouting ? <i className="fa-solid fa-spinner fa-spin"></i> : null}
                  {isScouting ? 'Syncing...' : 'Sync Polymarket'}
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {hotPredictions.length === 0 ? (
              <div className="py-12 text-center bg-neutral-900/30 rounded-[32px] border border-dashed border-neutral-800 mx-2">
                <div className="flex justify-center mb-3">
                  <i className="fa-solid fa-bolt text-brand-500 text-4xl opacity-20"></i>
                </div>
                <p className="text-neutral-500 text-xs font-medium">No hot markets yet. Sync from Polymarket!</p>
                {isAdmin && (
                  <button 
                    onClick={handleSyncMarkets} 
                    disabled={isScouting}
                    className="mt-4 text-brand-400 font-black text-sm uppercase tracking-widest flex items-center gap-2"
                  >
                    {isScouting && <i className="fa-solid fa-spinner fa-spin"></i>}
                    {isScouting ? 'Syncing...' : 'Sync Now'}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-0">
                {hotPredictions.map((p) => (
                  <div key={p.id} className="relative">
                    <PredictionCard 
                      prediction={p} 
                      isBookmarked={bookmarkedIds.has(p.id)}
                      onBookmark={() => handleBookmark(p.id)}
                      isLiked={likedIds.has(p.id)}
                      onLike={() => handleLike(p.id)}
                      isReposted={repostedIds.has(p.id)}
                      onRepost={() => handleRepost(p.id)}
                      onView={() => handleView(p.id)}
                      onParticipate={(side) => !p.isResolved && setSelectedPrediction({ p, side })}
                      onVote={(side) => handleVote(p.id, side)}
                      onStartVoting={() => handleStartVoting(p.id)}
                      onFinalizeVoting={() => setResolvingPrediction(p)}
                      onShare={(p) => setSharingPrediction(p)}
                      onClick={() => setSelectedDetail({ prediction: p })}
                      onCommentClick={() => setSelectedDetail({ prediction: p, initialTab: 'comments' })}
                      currentUserId={user?.uid}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-3 bg-neutral-900/50 border-y border-neutral-900/80"></div>

        {/* My Predictions Section */}
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg font-normal text-white italic flex items-center gap-2">
              <i className="fa-solid fa-user-ninja text-brand-600"></i>
              User Generated
            </h2>
          </div>
          <div className="space-y-4">
            {personalPredictions.length === 0 ? (
              <div className="py-12 text-center bg-neutral-900/30 rounded-[32px] border border-dashed border-neutral-800 mx-2">
                <div className="flex justify-center mb-3">
                  <i className="fa-solid fa-bolt text-brand-500 text-4xl opacity-20"></i>
                </div>
                <p className="text-neutral-500 text-xs font-medium">You haven't created any markets yet.</p>
                <button onClick={() => setActiveView(ViewType.CREATE_PREDICTION)} className="mt-4 text-brand-400 font-black text-sm uppercase tracking-widest">Create Market</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-0">
                {personalPredictions.map((p) => (
                  <div key={p.id} className="relative">
                    <PredictionCard 
                      prediction={p} 
                      isBookmarked={bookmarkedIds.has(p.id)}
                      onBookmark={() => handleBookmark(p.id)}
                      isLiked={likedIds.has(p.id)}
                      onLike={() => handleLike(p.id)}
                      isReposted={repostedIds.has(p.id)}
                      onRepost={() => handleRepost(p.id)}
                      onView={() => handleView(p.id)}
                      onParticipate={(side) => !p.isResolved && setSelectedPrediction({ p, side })}
                      onVote={(side) => handleVote(p.id, side)}
                      onStartVoting={() => handleStartVoting(p.id)}
                      onFinalizeVoting={() => setResolvingPrediction(p)}
                      onShare={(p) => setSharingPrediction(p)}
                      onClick={() => setSelectedDetail({ prediction: p })}
                      onCommentClick={() => setSelectedDetail({ prediction: p, initialTab: 'comments' })}
                      currentUserId={user?.uid}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-950 text-white selection:bg-brand-500/30">
        {!isAuthReady ? (
          <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-neutral-500 text-sm font-medium animate-pulse">Initializing Bingo...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-[1300px] mx-auto flex">
            {/* Left Sidebar - Desktop */}
            <div className="hidden md:block w-[275px] shrink-0">
              <Sidebar 
                activeView={activeView} 
                onNavClick={handleNavClick} 
                user={currentUser} 
                onLogout={handleLogout}
                isSignUp={isSignUp}
                setIsSignUp={setIsSignUp}
                loginEmail={loginEmail}
                setLoginEmail={setLoginEmail}
                loginPassword={loginPassword}
                setLoginPassword={setLoginPassword}
                authError={authError}
                isAuthLoading={isAuthLoading}
                onEmailAuth={handleEmailAuth}
                onGuestLogin={handleGuestLogin}
              />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 border-x border-neutral-900 min-h-screen relative">
            <div className="safe-bottom">
              {activeView === ViewType.CREATE_PREDICTION ? (
                <CreatePredictionView onBack={() => handleNavClick(ViewType.HOME)} onCreate={handleCreatePrediction} />
              ) : activeView === ViewType.FRIENDS ? (
                <FriendsView onBack={() => handleNavClick(ViewType.HOME)} />
              ) : activeView === ViewType.POINTS ? (
                <PointsCenterView 
                  userCreations={predictions.filter(p => p.creatorUid === user.uid)}
                  userPositions={userPositions.map(pos => ({
                    ...pos,
                    prediction: predictions.find(p => p.id === pos.predictionId)!
                  })).filter(pos => pos.prediction)}
                  onSelectPrediction={(p) => setSelectedDetail({ prediction: p })}
                  onResolve={(p) => setResolvingPrediction(p)}
                  balance={currentUser.balance}
                />
              ) : activeView === ViewType.LEADERBOARD ? (
                <LeaderboardView />
              ) : activeView === ViewType.HELP_CENTER ? (
                <HelpCenter />
              ) : activeView === ViewType.DISPUTE_MANAGEMENT ? (
                <DisputeManagement />
              ) : activeView === ViewType.TERMS_OF_SERVICE ? (
                <TermsOfServiceView onBack={() => handleNavClick(ViewType.HOME)} />
              ) : activeView === ViewType.EXPLORE ? (
                <ExploreView 
                  allPredictions={predictions} 
                  bookmarkedIds={bookmarkedIds} 
                  onBookmark={handleBookmark}
                  onSelectPrediction={(p) => setSelectedDetail({ prediction: p })}
                  searchQuery={globalSearchQuery}
                  onSearchChange={handleSearchChange}
                />
              ) : activeView === ViewType.PROFILE ? (
                <SettingsView onBack={() => handleNavClick(ViewType.HOME)} onLogout={handleLogout} user={currentUser} />
              ) : (
                renderHome()
              )}
              {renderAIActionBar()}
            </div>

            {/* Overlays */}
            {isVideoModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <div className="w-full max-w-2xl bg-neutral-900 rounded-[40px] overflow-hidden border border-neutral-800 shadow-2xl relative">
                  <button 
                    onClick={() => {
                      setIsVideoModalOpen(false);
                      setGeneratedVideoUrl(null);
                    }}
                    className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>

                  <div className="p-8">
                    <h2 className="text-2xl font-black text-white mb-2 italic">AI Video Summary</h2>
                    <p className="text-neutral-500 text-sm mb-8">Generated by Gemini Veo</p>

                    <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center relative border border-neutral-800">
                      {generatedVideoUrl ? (
                        <video 
                          src={generatedVideoUrl} 
                          controls 
                          autoPlay 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-6 text-center px-10">
                          <div className="relative">
                            <div className="w-20 h-20 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <i className="fa-solid fa-clapperboard text-purple-500 text-2xl animate-pulse"></i>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-white font-bold text-lg">Generating Cinematic Summary...</p>
                            <p className="text-neutral-500 text-xs leading-relaxed">
                              Our AI is analyzing the market data and creating a custom news segment. 
                              This usually takes about 30-60 seconds.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {generatedVideoUrl && (
                      <div className="mt-8 flex gap-4">
                        <a 
                          href={generatedVideoUrl} 
                          download="bingo-prediction-summary.mp4"
                          className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                          <i className="fa-solid fa-download"></i>
                          DOWNLOAD
                        </a>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(generatedVideoUrl);
                            showToast("Video link copied!");
                          }}
                          className="px-6 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-black rounded-2xl transition-all active:scale-95"
                        >
                          <i className="fa-solid fa-link"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedDetail && (
              <div className="fixed inset-0 z-[80] md:absolute md:inset-0 bg-neutral-950">
                <PredictionDetailView 
                  prediction={selectedDetail.prediction} 
                  initialTab={selectedDetail.initialTab}
                  onBack={() => setSelectedDetail(null)}
                  onParticipate={(side) => !selectedDetail.prediction.isResolved && setSelectedPrediction({ p: selectedDetail.prediction, side })}
                  onVote={(side) => handleVote(selectedDetail.prediction.id, side)}
                  onStartVoting={() => handleStartVoting(selectedDetail.prediction.id)}
                  onFinalizeVoting={() => setResolvingPrediction(selectedDetail.prediction)}
                  onReport={(id, type) => setReportingTarget({ id, type })}
                  onDispute={(p) => setDisputingPrediction(p)}
                  onGenerateVideo={(p) => handleGenerateVideo(p)}
                  currentUser={currentUser}
                  userPositions={userPositions}
                  isAdmin={isAdmin}
                />
              </div>
            )}
          </main>

          {/* Right Sidebar - Desktop */}
          <div className="hidden lg:block w-[350px] shrink-0">
            <RightSidebar 
              trendingPredictions={predictions.filter(p => p.volume > 0).sort((a, b) => b.volume - a.volume).slice(0, 4)}
            />
          </div>
        </div>
      )}

      {/* Mobile FAB Menu */}
      {user && isFabMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setIsFabMenuOpen(false)}>
          <div className="absolute bottom-40 right-6 flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <button 
              className="bg-brand-600 text-white px-6 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform flex items-center gap-3"
              onClick={() => { setIsFabMenuOpen(false); setActiveView(ViewType.CREATE_PREDICTION); }}
            >
              <i className="fa-solid fa-plus"></i>
              Create Prediction
            </button>
            <button 
              className="bg-neutral-900 text-white px-6 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform flex items-center gap-3 border border-neutral-800"
              onClick={() => { setIsFabMenuOpen(false); setActiveView(ViewType.FRIENDS); }}
            >
              <i className="fa-solid fa-user-plus"></i>
              Add Friends
            </button>
          </div>
        </div>
      )}

      {/* Mobile Main FAB Button */}
      {user && !selectedDetail && activeView !== ViewType.CREATE_PREDICTION && activeView !== ViewType.FRIENDS && (
        <button 
          onClick={() => setIsFabMenuOpen(!isFabMenuOpen)} 
          className="fixed bottom-24 right-6 w-14 h-14 bg-brand-600 hover:bg-brand-500 active:scale-90 transition-all rounded-full shadow-xl shadow-brand-600/30 flex items-center justify-center z-[70] md:hidden"
        >
          <i className={`fa-solid ${isFabMenuOpen ? 'fa-xmark' : 'fa-plus'} text-white text-2xl`}></i>
        </button>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {!selectedDetail && activeView !== ViewType.CREATE_PREDICTION && activeView !== ViewType.FRIENDS && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-900 h-20 px-6 flex items-center justify-between z-40 safe-bottom md:hidden">
          {[
            { icon: 'fa-house', view: ViewType.HOME },
            { icon: 'fa-coins', view: ViewType.POINTS },
            { icon: 'fa-magnifying-glass', view: ViewType.EXPLORE },
            { icon: 'fa-ranking-star', view: ViewType.LEADERBOARD },
          ].map((item, idx) => (
            <button 
              key={idx} 
              onClick={() => handleNavClick(item.view)} 
              className={`w-12 h-12 flex items-center justify-center transition-all active:scale-90 ${activeView === item.view ? 'text-white scale-110' : 'text-neutral-500'}`}
            >
              <i className={`fa-solid ${item.icon} text-xl`}></i>
            </button>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 md:top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
            toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-brand-600/20 border-brand-500/30 text-brand-400'
          }`}>
            <i className={`fa-solid ${toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Modal Layer */}
      {user && selectedPrediction && (
        <PredictionModal 
          prediction={selectedPrediction.p} 
          side={selectedPrediction.side} 
          onClose={() => setSelectedPrediction(null)} 
          onConfirm={handleConfirmPrediction} 
        />
      )}
      {user && sharingPrediction && <ShareCardModal prediction={sharingPrediction} user={user} onClose={() => setSharingPrediction(null)} />}
      
      {user && resolvingPrediction && (
        <ResolutionModal 
          prediction={resolvingPrediction} 
          onClose={() => setResolvingPrediction(null)} 
          onResolve={(res, sourceUrl) => handleResolvePrediction(resolvingPrediction.id, res, sourceUrl)}
        />
      )}

      {user && reportingTarget && (
        <ReportModal 
          isOpen={!!reportingTarget}
          onClose={() => setReportingTarget(null)}
          onSubmit={handleReport}
          targetType={reportingTarget.type}
        />
      )}

      {user && disputingPrediction && (
        <DisputeModal 
          isOpen={!!disputingPrediction}
          onClose={() => setDisputingPrediction(null)}
          onSubmit={handleDispute}
          predictionQuestion={disputingPrediction.question}
        />
      )}

      <AIChatWindow isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </div>
    </ErrorBoundary>
  );
};

export default App;
