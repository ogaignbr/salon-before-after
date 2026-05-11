import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-rose-50 to-white flex flex-col items-center justify-center px-6">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">BeforeAfter</h1>
        <p className="text-sm text-gray-500 mt-1">サロン撮影アプリ</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={() => navigate('/capture')}
          className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg active:bg-rose-600 transition text-lg"
        >
          新規撮影
        </button>
        <button
          onClick={() => navigate('/history')}
          className="w-full py-4 bg-white text-gray-700 font-bold rounded-2xl shadow border border-gray-200 active:bg-gray-50 transition text-lg"
        >
          撮影履歴
        </button>
      </div>
    </div>
  );
}
