import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, needsPinChange, loading, subscription } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="mt-3 text-slate-400 font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (needsPinChange) {
    return <Navigate to="/" replace />;
  }

  if (subscription !== 'active' && subscription !== 'trialing') {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
}
