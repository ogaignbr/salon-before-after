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
        <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
          <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6 text-center">
            <div className="text-4xl mb-4">&#9888;&#65039;</div>
            <h1 className="text-xl font-black text-pink-500">エラーが発生しました</h1>
            <p className="text-xs text-pink-400 mt-2">申し訳ございません。ページを再読み込みしてください。</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform"
            >
              ページを再読み込み
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
            {/* ランディング = ログイン */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/subscribe" element={<SubscribePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* 認証 + サブスク必須ページ */}
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
