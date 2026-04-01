
import React from 'react';
import { ViewType, BingoUser } from '../types';

interface SidebarProps {
  activeView: ViewType;
  onNavClick: (view: ViewType) => void;
  user: BingoUser | null;
  onLogout: () => void;
  isSignUp: boolean;
  setIsSignUp: (val: boolean) => void;
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  authError: string | null;
  isAuthLoading: boolean;
  onEmailAuth: (e: React.FormEvent) => void;
  onGuestLogin: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onNavClick, 
  user, 
  onLogout, 
  isSignUp,
  setIsSignUp,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  authError,
  isAuthLoading,
  onEmailAuth,
  onGuestLogin
}) => {
  const navItems = [
    { label: 'Home', icon: 'fa-house', view: ViewType.HOME },
    { label: 'Explore', icon: 'fa-magnifying-glass', view: ViewType.EXPLORE },
    { label: 'Leaderboard', icon: 'fa-ranking-star', view: ViewType.LEADERBOARD },
    { label: 'Points Center', icon: 'fa-coins', view: ViewType.POINTS },
    { label: 'Friends', icon: 'fa-user-group', view: ViewType.FRIENDS },
    { label: 'Help Center', icon: 'fa-circle-question', view: ViewType.HELP_CENTER },
    ...(user?.uid && user?.email === 'lzhao5812@gmail.com' ? [{ label: 'Disputes', icon: 'fa-gavel', view: ViewType.DISPUTE_MANAGEMENT }] : []),
    { label: 'Profile', icon: 'fa-user', view: ViewType.PROFILE },
  ];

  const isLoggedIn = user && user.uid && !user.uid.startsWith('local_guest_');

  return (
    <div className="flex flex-col h-screen sticky top-0 p-4 border-r border-neutral-900 w-full max-w-[275px] overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-3 px-4 mb-8">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/20">
          <i className="fa-solid fa-bolt text-white text-xl"></i>
        </div>
        <span className="text-2xl font-black tracking-tight text-white">Bingo</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavClick(item.view)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
              activeView === item.view 
                ? 'bg-brand-600/10 text-brand-400' 
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-xl w-8 text-center ${activeView === item.view ? 'text-brand-400' : 'group-hover:text-white'}`}></i>
            <span className="text-lg font-bold">{item.label}</span>
          </button>
        ))}

      </nav>

      <div className="mt-8 pt-4 border-t border-neutral-900">
        {isLoggedIn ? (
          <div className="flex items-center gap-3 px-2 mb-4">
            <img src={user?.avatar || 'https://picsum.photos/seed/user/100/100'} alt="User" className="w-10 h-10 rounded-full border border-neutral-800" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold truncate">{user?.name || 'User'}</p>
              <p className="text-neutral-500 text-xs truncate font-mono">{user?.handle}</p>
            </div>
            <button onClick={onLogout} className="text-neutral-500 hover:text-red-500 transition-colors" title="Log Out">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        ) : (
          <div className="space-y-4 px-2 pb-4">
            <div className="text-center mb-4">
              <h3 className="text-white font-black text-sm italic uppercase tracking-widest mb-1">Join Bingo</h3>
              <p className="text-neutral-500 text-[10px] font-medium">Predict with friends today!</p>
            </div>
            
            <form onSubmit={onEmailAuth} className="space-y-2">
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 text-xs"></i>
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 text-xs"></i>
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-brand-500 transition-colors"
                  required
                />
              </div>
              
              {authError && (
                <div className="text-red-500 text-[10px] font-bold bg-red-500/10 py-1.5 px-2 rounded-lg border border-red-500/20 leading-tight">
                  {authError}
                </div>
              )}
              
              <button 
                type="submit"
                disabled={isAuthLoading}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl font-black text-xs shadow-lg shadow-brand-600/10 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isAuthLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className={`fa-solid ${isSignUp ? 'fa-user-plus' : 'fa-right-to-bracket'}`}></i>}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>
            
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-neutral-900"></div>
              <span className="text-neutral-700 text-[8px] font-black uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-neutral-900"></div>
            </div>
            
            <button 
              onClick={onGuestLogin}
              disabled={isAuthLoading}
              className="w-full bg-neutral-900 text-neutral-500 py-2 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 hover:bg-neutral-800 hover:text-white transition-all border border-neutral-800"
            >
              <i className="fa-solid fa-user-secret"></i>
              Guest Mode
            </button>
            
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-brand-500 text-[10px] font-bold hover:underline text-center"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 px-2 border-t border-neutral-900/50">
        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-3">© 2026 Bingo Social Prediction</p>
        <div className="space-y-3">
          <p className="text-[9px] text-neutral-600 leading-relaxed font-medium">
            This application is a social prediction game designed for entertainment purposes only. Users participate by expressing their opinions on future events through interactive polls.
          </p>
          <p className="text-[9px] text-neutral-600 leading-relaxed font-medium">
            The platform uses virtual points that have no monetary value and cannot be exchanged, redeemed, or converted into cash, cryptocurrency, or any other real-world assets.
          </p>
          <p className="text-[9px] text-neutral-600 leading-relaxed font-medium">
            All outcomes are determined by community voting and do not reflect real-world event settlements or financial results.
          </p>
          <p className="text-[9px] text-neutral-600 leading-relaxed font-medium">
            This application does not offer, facilitate, or promote gambling, betting, or any form of financial trading.
          </p>
          <button 
            onClick={() => onNavClick(ViewType.TERMS_OF_SERVICE)}
            className="text-[9px] text-brand-500 font-black uppercase tracking-widest hover:underline"
          >
            Terms of Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
