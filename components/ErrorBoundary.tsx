
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try again later.";
      let details = "";

      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error) {
            errorMessage = "Firestore Permission Error";
            details = `Operation: ${parsedError.operationType} on ${parsedError.path}. Error: ${parsedError.error}`;
          }
        }
      } catch {
        // Not a JSON error, use default
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center mb-8 border border-red-500/30">
            <i className="fa-solid fa-triangle-exclamation text-red-500 text-4xl"></i>
          </div>
          <h1 className="text-2xl font-black text-white mb-4 tracking-tight">Oops! {errorMessage}</h1>
          {details && (
            <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 mb-8 max-w-md overflow-hidden">
              <p className="text-xs text-neutral-500 font-mono break-all">{details}</p>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-black px-8 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
