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
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(160deg,#fbfcff_0%,#f4f6ff_48%,#eef2ff_100%)] text-slate-800 dark:bg-[linear-gradient(160deg,#060913_0%,#0b1020_45%,#111827_100%)] dark:text-slate-100">
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
    <div className="mb-4 flex items-center rounded-[14px] border border-white/55 bg-white/65 px-3 py-2.5 shadow-[0_10px_26px_-20px_rgba(46,74,187,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_14px_38px_-28px_rgba(18,32,77,0.9)]">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-500 transition-colors hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </button>
      ) : (
        <div className="w-12" />
      )}
      <h1 className="flex-1 text-center text-sm font-bold tracking-[0.03em] text-slate-800 dark:text-slate-100">{title}</h1>
      <div className="flex min-w-[48px] justify-end">{rightSlot ?? <div className="w-12" />}</div>
    </div>
  );
}
