import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import pitacameLogo from '../../ぴたカメロゴ.png';

export default function HomePage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const useCases = [
    {
      label: '美容',
      icon: 'M9 3.75a.75.75 0 01.75.75v3.084a3.75 3.75 0 012.277 3.44 3.75 3.75 0 01-2.777 3.615V18a.75.75 0 01-1.5 0v-3.111A3.75 3.75 0 015 11.024a3.75 3.75 0 012.25-3.44V4.5A.75.75 0 018 3.75h1zM15.75 6a.75.75 0 01.75.75v1.69a2.25 2.25 0 011.5 2.12 2.25 2.25 0 01-1.5 2.12v4.57a.75.75 0 01-1.5 0v-4.57a2.25 2.25 0 01-1.5-2.12 2.25 2.25 0 011.5-2.12V6.75a.75.75 0 01.75-.75z',
    },
    {
      label: 'フード',
      icon: 'M7.5 2.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zm3 0a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zm3 0a.75.75 0 01.75.75v6A3.75 3.75 0 0116.5 12.3V21a.75.75 0 01-1.5 0v-8.7a3.75 3.75 0 01-2.25-3.3V3a.75.75 0 01.75-.75zM5.25 10.5h6',
    },
    {
      label: '商品撮影',
      icon: 'M3.75 7.5L12 3l8.25 4.5M4.5 7.5V18L12 22.5 19.5 18V7.5M12 12l7.5-4.5M12 12L4.5 7.5M12 12v10.5',
    },
    {
      label: '作業報告',
      icon: 'M7.5 3.75h9A2.25 2.25 0 0118.75 6v13.5A2.25 2.25 0 0116.5 21.75h-9A2.25 2.25 0 015.25 19.5V6A2.25 2.25 0 017.5 3.75zm1.5 4.5h6m-6 3h6m-6 3h4.5',
    },
    {
      label: '作品記録',
      icon: 'M4.5 7.5A2.25 2.25 0 016.75 5.25h10.5A2.25 2.25 0 0119.5 7.5v9A2.25 2.25 0 0117.25 18.75H6.75A2.25 2.25 0 014.5 16.5v-9zm2.25 7.125l2.25-2.25a1.5 1.5 0 012.122 0l1.128 1.128a1.5 1.5 0 002.122 0l1.878-1.878M15 9.75h.008v.008H15V9.75z',
    },
    {
      label: '成長・観察',
      icon: 'M4.5 16.5l4.5-4.5 3 3 7.5-7.5M15 7.5h4.5V12',
    },
  ];

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(160deg,#F0FBF8_0%,#EDF7FB_48%,#EAF5FB_100%)] text-[#1B3A5C] dark:bg-[linear-gradient(160deg,#060913_0%,#0b1020_45%,#111827_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <span className="bg-ornament bg-ornament-circle left-[7%] top-[10%]" />
        <span className="bg-ornament bg-ornament-square right-[11%] top-[17%]" />
        <span className="bg-ornament bg-ornament-triangle left-[18%] top-[44%]" />
        <span className="bg-ornament bg-ornament-star right-[8%] top-[52%]" />
        <span className="bg-ornament bg-ornament-line left-[12%] bottom-[20%]" />
        <span className="bg-ornament bg-ornament-line right-[16%] bottom-[15%]" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-6 pt-4">
        <div className="mb-6 flex items-center justify-between rounded-[16px] border border-[#A8DDE5]/30 bg-[rgba(255,255,255,0.92)] px-4 py-2.5 shadow-[0_12px_32px_rgba(60,140,170,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_14px_38px_-28px_rgba(18,32,77,0.9)]">
          <p className="max-w-[210px] truncate text-[11px] font-medium text-[#5B7689] dark:text-slate-400">{user?.email ?? '----'}</p>
          <button
            onClick={async () => {
              if (signingOut) return;
              setSigningOut(true);
              await signOut();
              navigate('/', { replace: true });
            }}
            disabled={signingOut}
            className="text-[11px] font-semibold text-[#5B7689] transition-colors hover:text-[#1B3A5C] dark:text-slate-300 dark:hover:text-slate-100"
          >
            {signingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>

        <div className="mb-8 mt-3 text-center animate-slide-up">
          <div className="mx-auto mb-4 rounded-[20px] border border-[#A8DDE5]/35 bg-[rgba(255,255,255,0.94)] p-3 shadow-[0_12px_32px_rgba(60,140,170,0.12)] backdrop-blur-xl dark:border-cyan-300/15 dark:bg-slate-900/62 dark:shadow-[0_25px_45px_-30px_rgba(120,220,210,0.55)]">
            <img
              src={pitacameLogo}
              alt="ぴたカメロゴ"
              className="mx-auto h-auto w-full max-w-[240px] rounded-[10px]"
            />
          </div>
          <p className="mt-1 text-[14px] font-medium text-[#5B7689] dark:text-slate-400">好きな画像にぴたっと合わせて撮れるカメラ</p>
        </div>

        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.08s' }}>
          <button
            onClick={() => navigate('/capture')}
            className="animate-subtle-pulse flex w-full items-center justify-center gap-2.5 rounded-[12px] border border-[#5BB5E7]/30 bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] px-4 py-4 text-[20px] font-bold text-white shadow-[0_8px_18px_rgba(70,160,200,0.24)] transition-all hover:brightness-105 active:scale-[0.985]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a2 2 0 012-2h1.3a2 2 0 001.6-.8l.42-.56A2 2 0 0111.12 5h1.76a2 2 0 011.8 1.12l.42.56a2 2 0 001.6.8H18a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="12.5" r="2.8" />
            </svg>
            画像に合わせて撮る
          </button>
        </div>

        <div className="mt-7 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="grid grid-cols-3 gap-2.5">
            {useCases.map((item) => (
              <div
                key={item.label}
                className="rounded-[16px] border border-[#A8DDE5]/30 bg-[rgba(255,255,255,0.92)] px-2.5 py-3 text-center shadow-[0_10px_28px_rgba(60,140,170,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_16px_32px_-26px_rgba(40,58,120,0.8)]"
              >
                <svg
                  className="mx-auto mb-1.5 h-5 w-5 text-[#3DC4A8] dark:text-cyan-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.7}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="text-[11px] font-semibold tracking-[0.02em] text-[#1B3A5C] dark:text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-8 text-center animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <p className="mb-3 text-xs font-medium tracking-[0.06em] text-[#5B7689] dark:text-slate-400">その場で撮って、その場で保存</p>
          <div className="mx-auto flex w-fit items-center gap-3 rounded-[16px] border border-[#C9E5E0] bg-white px-4 py-1.5 text-xs text-[#5B7689] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-400">
            <button onClick={() => navigate('/terms')} className="transition-colors hover:text-[#1B3A5C] dark:hover:text-slate-200">
              利用規約
            </button>
            <span className="text-[#C9E5E0] dark:text-slate-600">|</span>
            <button onClick={() => navigate('/privacy')} className="transition-colors hover:text-[#1B3A5C] dark:hover:text-slate-200">
              プライバシー
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
