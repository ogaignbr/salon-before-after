import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  if (showMenu) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex flex-col items-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-6 left-6 text-pink-300 text-2xl animate-sparkle">&#10022;</div>
        <div className="absolute top-16 right-8 text-yellow-300 text-xl animate-sparkle" style={{ animationDelay: '1s' }}>&#9733;</div>
        <div className="absolute top-32 left-10 text-purple-300 text-lg animate-sparkle" style={{ animationDelay: '0.5s' }}>&#9829;</div>
        <div className="absolute bottom-40 right-6 text-mint-300 text-2xl animate-sparkle" style={{ animationDelay: '1.5s' }}>&#10022;</div>

        {/* Back button */}
        <div className="w-full px-4 pt-4">
          <button
            onClick={() => setShowMenu(false)}
            className="text-pink-400 font-bold text-sm flex items-center gap-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            もどる
          </button>
        </div>

        {/* Logo area */}
        <div className="mt-8 mb-10 text-center animate-slide-up">
          <h1 className="text-4xl font-black bg-gradient-to-r from-pink-400 via-pink-500 to-rose-400 bg-clip-text text-transparent drop-shadow-sm">
            ぴたカメ
          </h1>
          <p className="text-sm text-pink-400 font-bold mt-1">なにする？</p>
        </div>

        {/* Menu cards */}
        <div className="w-full max-w-xs space-y-4 px-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <button
            onClick={() => navigate('/capture')}
            className="w-full py-5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform text-lg flex items-center justify-center gap-3 animate-pulse-glow"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            撮影スタート！
          </button>

          <button
            onClick={() => navigate('/history')}
            className="w-full py-5 bg-white text-pink-500 font-black rounded-2xl shadow-md border-2 border-pink-200 active:scale-95 transition-transform text-lg flex items-center justify-center gap-3"
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            記録をみる
          </button>
        </div>

        {/* Bottom links */}
        <div className="mt-auto pb-6 text-center animate-fade-in space-y-2" style={{ animationDelay: '0.4s' }}>
          <p className="text-xs text-pink-300 font-bold">ぴたっと撮れる。変化が伝わる。</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate('/terms')} className="text-[10px] text-pink-300 underline">利用規約</button>
            <button onClick={() => navigate('/privacy')} className="text-[10px] text-pink-300 underline">プライバシーポリシー</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 to-pink-50 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative sparkles */}
      <div className="absolute top-8 left-8 text-pink-300 text-3xl animate-sparkle">&#10022;</div>
      <div className="absolute top-20 right-10 text-yellow-300 text-2xl animate-sparkle" style={{ animationDelay: '0.7s' }}>&#9733;</div>
      <div className="absolute bottom-32 left-6 text-purple-300 text-xl animate-sparkle" style={{ animationDelay: '1.2s' }}>&#9829;</div>
      <div className="absolute bottom-20 right-8 text-teal-300 text-2xl animate-sparkle" style={{ animationDelay: '0.3s' }}>&#10022;</div>

      {/* Cover image */}
      <div className="w-full max-w-sm px-6 animate-fade-in">
        <img
          src={`${import.meta.env.BASE_URL}cover.jpg`}
          alt="ぴたカメ"
          className="w-full rounded-3xl shadow-2xl"
        />
      </div>

      {/* Floating CTA button */}
      <div className="mt-8 animate-float">
        <button
          onClick={() => setShowMenu(true)}
          className="px-10 py-4 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white font-black rounded-full text-xl shadow-xl active:scale-95 transition-transform animate-pulse-glow"
        >
          はじめる &#10148;
        </button>
      </div>

      {/* Bottom tagline */}
      <p className="mt-6 text-sm text-pink-400 font-bold animate-fade-in" style={{ animationDelay: '0.5s' }}>
        ぴたっと撮れる。変化が伝わる。&#9829;
      </p>
      <div className="mt-3 flex justify-center gap-3 animate-fade-in" style={{ animationDelay: '0.7s' }}>
        <button onClick={() => navigate('/terms')} className="text-[10px] text-pink-300 underline">利用規約</button>
        <button onClick={() => navigate('/privacy')} className="text-[10px] text-pink-300 underline">プライバシーポリシー</button>
      </div>
    </div>
  );
}
