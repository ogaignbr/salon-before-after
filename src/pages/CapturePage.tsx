import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import GuideLines from '../components/GuideLines';
import GhostOverlay from '../components/GhostOverlay';
import GridOverlay from '../components/GridOverlay';
import { db } from '../lib/db';
import type { ShootingPart } from '../types';
import { AppFrame, AppHeader } from '../components/AppFrame';

export default function CapturePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeSessionId = searchParams.get('session');

  const { videoRef, isReady, error, start, stop, capture, switchCamera, facingMode } = useCamera();
  const [part, setPart] = useState<ShootingPart>('face');
  const [customerName, setCustomerName] = useState('');
  const [step, setStep] = useState<'setup' | 'before' | 'after'>('setup');
  const [beforeBlob, setBeforeBlob] = useState<Blob | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [ghostOpacity, setGhostOpacity] = useState(0.35);
  const [showGuide, setShowGuide] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [flash, setFlash] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (resumeSessionId) {
      const id = Number(resumeSessionId);
      db.sessions.get(id).then((s) => {
        if (s) {
          setCustomerName(s.customerName);
          setPart(s.part);
          setBeforeBlob(s.beforeImage);
          setSessionId(id);
          setStep('after');
        }
      });
    }
  }, [resumeSessionId]);

  useEffect(() => {
    if (step !== 'setup') {
      start();
    }
    return () => stop();
  }, [step]);

  const triggerFlash = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  };

  const handleCaptureBefore = async () => {
    const blob = capture();
    if (!blob) return;
    triggerFlash();
    setBeforeBlob(blob);

    const id = await db.sessions.add({
      customerName: customerName || 'Unnamed',
      part,
      beforeImage: blob,
      createdAt: new Date(),
    });
    setSessionId(id);
    setStep('after');
  };

  const handleCaptureAfter = async () => {
    const blob = capture();
    if (!blob || !beforeBlob || !sessionId) return;
    triggerFlash();
    stop();

    await db.sessions.update(sessionId, {
      afterImage: blob,
    });

    navigate(`/preview/${sessionId}`);
  };

  const handleRetakeBefore = async () => {
    if (sessionId) {
      await db.sessions.delete(sessionId);
      setSessionId(null);
    }
    setBeforeBlob(null);
    setStep('before');
  };

  if (step === 'setup') {
    return (
      <AppFrame>
        <AppHeader title="撮影設定" onBack={() => navigate('/home')} backLabel="ホーム" />

        <div className="flex-1 space-y-5 px-1 pb-2 pt-1 animate-slide-up">
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-[0.08em] text-[#161B5C] dark:text-slate-300">
              顧客名
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="例: 山田 花子"
              className="w-full rounded-[10px] border border-[#B8A8F8] bg-white px-4 py-3 text-sm font-medium text-[#161B5C] outline-none transition-all placeholder:text-[#9A9AB0] focus:border-[#6B4CFF] focus:ring-2 focus:ring-[#6B4CFF]/20 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-[0.08em] text-[#161B5C] dark:text-slate-300">
              撮影部位
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPart('face')}
                className={`py-4 rounded-[10px] text-sm font-semibold transition-all ${
                  part === 'face'
                    ? 'bg-[linear-gradient(135deg,#6B4CFF_0%,#7B54FF_48%,#8B5CFF_100%)] text-white shadow-[0_8px_18px_rgba(90,65,230,0.24)]'
                    : 'bg-white text-[#6B6F8A] border border-[#6B4CFF]/60 hover:bg-[#F4F2FF] dark:bg-slate-900/45 dark:text-slate-200 dark:border-indigo-300/20'
                }`}
              >
                顔
              </button>
              <button
                onClick={() => setPart('body')}
                className={`py-4 rounded-[10px] text-sm font-semibold transition-all ${
                  part === 'body'
                    ? 'bg-[linear-gradient(135deg,#6B4CFF_0%,#7B54FF_48%,#8B5CFF_100%)] text-white shadow-[0_8px_18px_rgba(90,65,230,0.24)]'
                    : 'bg-white text-[#6B6F8A] border border-[#6B4CFF]/60 hover:bg-[#F4F2FF] dark:bg-slate-900/45 dark:text-slate-200 dark:border-indigo-300/20'
                }`}
              >
                体
              </button>
            </div>
          </div>

          {/* Consent area */}
          <div className="rounded-[16px] border border-[#B9A7FF]/30 bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_10px_28px_rgba(85,70,180,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_16px_34px_-26px_rgba(45,74,152,0.85)] space-y-3">
            <p className="text-[11px] leading-relaxed text-[#6B6F8A] dark:text-slate-400">
              撮影前に必ずお客様の同意を得てください。写真データはこの端末内に保存され、外部サーバーには送信されません。
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#6B4CFF] rounded flex-shrink-0"
              />
              <span className="text-[11px] leading-snug text-[#161B5C] dark:text-slate-300">
                お客様の同意を取得しました。
                <button
                  type="button"
                  onClick={() => navigate('/privacy')}
                  className="ml-1 text-[#6B4CFF] hover:text-[#8B5CFF] dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  プライバシー
                </button>
                {' / '}
                <button
                  type="button"
                  onClick={() => navigate('/terms')}
                  className="text-[#6B4CFF] hover:text-[#8B5CFF] dark:text-indigo-300 dark:hover:text-indigo-200"
                >
                  利用規約
                </button>
              </span>
            </label>
          </div>

          <button
            onClick={() => setStep('before')}
            disabled={!consent}
            className="sheen-wrap w-full rounded-[10px] border border-[#8B5CFF]/30 bg-[linear-gradient(135deg,#6B4CFF_0%,#7B54FF_48%,#8B5CFF_100%)] py-4 text-base font-bold text-white shadow-[0_8px_18px_rgba(90,65,230,0.24)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-30 disabled:scale-100"
          >
            撮影を開始する
          </button>
        </div>
      </AppFrame>
    );
  }

  return (
    <div className="h-dvh bg-black flex flex-col relative overflow-hidden">
      {/* Flash effect */}
      {flash && <div className="absolute inset-0 bg-white z-50" />}

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2.5 bg-slate-900/80 backdrop-blur-md text-white border-b border-white/10">
        <button
          onClick={() => {
            stop();
            if (step === 'after') handleRetakeBefore();
            else { setStep('setup'); }
          }}
          className="text-sm font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>
        <span className="font-semibold text-sm tracking-wide">
          {step === 'before' ? 'BEFORE' : 'AFTER'}
        </span>
        <button onClick={switchCamera} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          autoPlay
          playsInline
          muted
        />

        {step === 'after' && beforeBlob && (
          <GhostOverlay imageBlob={beforeBlob} opacity={ghostOpacity} />
        )}

        {showGuide && <GuideLines part={part} />}
        {showGrid && <GridOverlay />}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center p-4">
            <p className="font-medium">{error}</p>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-5 top-[18%] z-10 h-2 w-2 rounded-full bg-[#6B4CFF]/40 animate-pulse" />
      <div className="pointer-events-none absolute right-7 top-[38%] z-10 h-1.5 w-1.5 rounded-full bg-[#8B5CFF]/50 animate-pulse" />

      {/* Controls */}
      <div className="relative z-20 bg-gradient-to-t from-black/95 to-black/70 px-4 py-4 space-y-3">
        {step === 'after' && (
          <div className="flex items-center gap-3 px-2">
            <span className="text-white/70 text-xs font-medium whitespace-nowrap">重ね表示</span>
            <input
              type="range"
              min="0"
              max="80"
              value={ghostOpacity * 100}
              onChange={(e) => setGhostOpacity(Number(e.target.value) / 100)}
              className="flex-1 accent-[#6B4CFF]"
            />
          </div>
        )}

        {/* Toggle buttons */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition ${showGuide ? 'bg-[#6B4CFF]/60 text-white' : 'bg-white/10 text-white/40'}`}
          >
            ガイド {showGuide ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition ${showGrid ? 'bg-[#6B4CFF]/60 text-white' : 'bg-white/10 text-white/40'}`}
          >
            グリッド {showGrid ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Shutter button */}
        <div className="flex items-center justify-center">
          <button
            onClick={step === 'before' ? handleCaptureBefore : handleCaptureAfter}
            disabled={!isReady}
            className="w-18 h-18 rounded-full border-[3px] border-white/60 flex items-center justify-center disabled:opacity-30 shadow-lg"
          >
            <div className="w-14 h-14 rounded-full bg-white active:bg-slate-200 transition" />
          </button>
        </div>
      </div>
    </div>
  );
}
