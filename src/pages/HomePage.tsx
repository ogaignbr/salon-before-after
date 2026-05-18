import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { signOut, user, openCustomerPortal } = useAuth();

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col items-center">
      {/* Top bar */}
      <div className="w-full px-5 pt-4 pb-3 flex items-center justify-between bg-white border-b border-slate-100">
        <p className="text-slate-400 text-xs font-medium truncate max-w-[200px]">{user?.email ?? '----'}</p>
        <button
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
          className="text-slate-400 text-xs font-medium hover:text-slate-600 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Logo area */}
      <div className="mt-12 mb-10 text-center animate-slide-up">
        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">PitaCame</h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">Compare Camera for Business</p>
      </div>

      {/* Menu cards */}
      <div className="w-full max-w-sm space-y-3 px-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <button
          onClick={() => navigate('/capture')}
          className="w-full py-5 bg-indigo-600 text-white font-semibold rounded-2xl shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all text-base flex items-center justify-center gap-3 animate-subtle-pulse"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          Start Capture
        </button>

        <button
          onClick={() => navigate('/history')}
          className="w-full py-5 bg-white text-slate-700 font-semibold rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 active:scale-[0.98] transition-all text-base flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          View Records
        </button>
      </div>

      {/* Use cases hint */}
      <div className="w-full max-w-sm px-6 mt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Beauty', icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z' },
            { label: 'Food', icon: 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z' },
            { label: 'Products', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
            { label: 'Work', icon: 'M11.42 15.17l-5.1-5.1m0 0L3.34 7.09m2.98 2.98L8.5 7.89m2.92 7.28l5.1-5.1m0 0l2.98-2.98m-2.98 2.98L14.5 7.89' },
            { label: 'Art', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42' },
            { label: 'Growth', icon: 'M2.25 18L9 11.25l4 4L21.75 7.5' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-white border border-slate-100 shadow-sm">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-[11px] font-medium text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom links */}
      <div className="mt-auto pb-6 pt-8 text-center animate-fade-in space-y-3" style={{ animationDelay: '0.4s' }}>
        <p className="text-xs text-slate-400 font-medium">Align. Capture. Compare.</p>
        <button
          onClick={async () => {
            try {
              const result = await openCustomerPortal();
              if (result.error) alert(result.error);
            } catch {
              alert('Connection failed. Please try again.');
            }
          }}
          className="text-xs text-indigo-500 font-medium hover:text-indigo-700 transition-colors"
        >
          Manage Subscription
        </button>
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate('/terms')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Terms</button>
          <span className="text-xs text-slate-300">|</span>
          <button onClick={() => navigate('/privacy')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Privacy</button>
        </div>
      </div>
    </div>
  );
}
