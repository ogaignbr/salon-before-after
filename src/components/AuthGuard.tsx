import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, subscription, hasStripeSubscription, needsPinChange, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center">
        <div className="text-pink-400 font-bold animate-pulse">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (needsPinChange) {
    return <Navigate to="/login" replace />;
  }

  if (!hasStripeSubscription) {
    return <Navigate to="/subscribe" replace />;
  }

  if (
    subscription === 'expired'
    || subscription === 'canceled'
    || subscription === 'past_due'
    || subscription === 'none'
  ) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
}
