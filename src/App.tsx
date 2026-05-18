import { Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import HomePage from './pages/HomePage';
import CapturePage from './pages/CapturePage';
import PreviewPage from './pages/PreviewPage';
import HistoryPage from './pages/HistoryPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SubscribePage from './pages/SubscribePage';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-slate-50 flex items-center justify-center px-6">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-800">An error occurred</h1>
            <p className="text-sm text-slate-500 mt-2">Please reload the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <ErrorBoundary>
      <BrowserRouter basename={basename || undefined}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/subscribe" element={<SubscribePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            <Route path="/home" element={<AuthGuard><HomePage /></AuthGuard>} />
            <Route path="/capture" element={<AuthGuard><CapturePage /></AuthGuard>} />
            <Route path="/preview/:id" element={<AuthGuard><PreviewPage /></AuthGuard>} />
            <Route path="/history" element={<AuthGuard><HistoryPage /></AuthGuard>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
