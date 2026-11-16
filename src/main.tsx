import { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SkyCalc runtime error:', error, info);
  }

  handleReset = () => {
    try {
      window.localStorage.removeItem('skycalc_history_v1');
    } catch {
      // Ignore storage errors
    }
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080D14] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-sm w-full bg-[#0B111C] border border-slate-800 rounded-2xl p-6 text-center">
            <h1 className="text-base font-semibold text-slate-100">Unable to load calculator</h1>
            <p className="text-sm text-slate-400 mt-2">
              Resetting local calculator state should restore the interface.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-4 px-4 py-2 text-sm font-semibold rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer"
            >
              Reset Calculator
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
