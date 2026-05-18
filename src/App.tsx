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

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename || undefined}>
      <AuthProvider>
        <Routes>
          {/* 公開ページ */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* 認証 + サブスク必須ページ */}
          <Route path="/" element={<AuthGuard><HomePage /></AuthGuard>} />
          <Route path="/capture" element={<AuthGuard><CapturePage /></AuthGuard>} />
          <Route path="/preview/:id" element={<AuthGuard><PreviewPage /></AuthGuard>} />
          <Route path="/history" element={<AuthGuard><HistoryPage /></AuthGuard>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
