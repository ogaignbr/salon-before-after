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
import { AppFrame } from './components/AppFrame';

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
        <AppFrame>
          <div className="mx-auto flex w-full max-w-sm flex-1 items-center">
          <div className="w-full rounded-[16px] border border-white/65 bg-white/75 p-6 text-center shadow-[0_18px_36px_-28px_rgba(68,82,147,0.75)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_20px_42px_-30px_rgba(30,46,105,0.9)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-rose-200/70 bg-rose-50/80 dark:border-rose-300/20 dark:bg-rose-500/10">
              <svg className="h-6 w-6 text-rose-500 dark:text-rose-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">エラーが発生しました</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">ページを再読み込みしてください。</p>
            <button
              onClick={() => window.location.reload()}
              className="sheen-wrap mt-5 w-full rounded-[12px] border border-indigo-300/30 bg-[linear-gradient(135deg,#5f7bff_0%,#6a60ff_48%,#8a49ff_100%)] py-3 font-bold text-white shadow-[0_16px_30px_-20px_rgba(86,89,255,0.95)] transition-all hover:brightness-105 active:scale-[0.99]"
            >
              再読み込み
            </button>
          </div>
          </div>
        </AppFrame>
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
