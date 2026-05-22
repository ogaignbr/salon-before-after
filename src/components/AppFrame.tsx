import type { ReactNode } from 'react';

interface AppFrameProps {
  children: ReactNode;
}

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  rightSlot?: ReactNode;
}

export function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(160deg,#F0FBF8_0%,#EDF7FB_48%,#EAF5FB_100%)] text-[#1B3A5C] dark:bg-[linear-gradient(160deg,#060913_0%,#0b1020_45%,#111827_100%)] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <span className="bg-ornament bg-ornament-circle left-[8%] top-[9%]" />
        <span className="bg-ornament bg-ornament-square right-[13%] top-[15%]" />
        <span className="bg-ornament bg-ornament-triangle left-[16%] top-[42%]" />
        <span className="bg-ornament bg-ornament-star right-[10%] top-[52%]" />
        <span className="bg-ornament bg-ornament-line left-[10%] bottom-[18%]" />
        <span className="bg-ornament bg-ornament-line right-[18%] bottom-[13%]" />
      </div>
      <div className="pointer-events-none absolute inset-0">
        <span className="sparkle-dot sparkle-delay-0 left-[18%] top-[22%]" />
        <span className="sparkle-dot sparkle-delay-1 right-[22%] top-[30%]" />
        <span className="sparkle-dot sparkle-delay-2 left-[28%] bottom-[27%]" />
      </div>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-6 pt-4">{children}</div>
    </div>
  );
}

export function AppHeader({ title, onBack, backLabel = '戻る', rightSlot }: AppHeaderProps) {
  return (
    <div className="mb-4 flex items-center rounded-[16px] border border-[#A8DDE5]/30 bg-[rgba(255,255,255,0.92)] px-3 py-2.5 shadow-[0_12px_32px_rgba(60,140,170,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_14px_38px_-28px_rgba(18,32,77,0.9)]">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#3DC4A8] transition-colors hover:text-[#5BB5E7] dark:text-cyan-300 dark:hover:text-cyan-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </button>
      ) : (
        <div className="w-12" />
      )}
      <h1 className="flex-1 text-center text-sm font-bold tracking-[0.03em] text-[#1B3A5C] dark:text-slate-100">{title}</h1>
      <div className="flex min-w-[48px] justify-end">{rightSlot ?? <div className="w-12" />}</div>
    </div>
  );
}
