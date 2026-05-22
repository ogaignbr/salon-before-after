import { useEffect, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import GhostOverlay from '../components/GhostOverlay';
import CompositionGuides from '../components/CompositionGuides';
import { blobToDataURL } from '../lib/imageProcessor';
import { AppFrame, AppHeader } from '../components/AppFrame';

export default function CapturePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { referenceImage?: Blob } | null;
  const { videoRef, isReady, error, start, stop, capture, switchCamera, facingMode } = useCamera();
  const [step, setStep] = useState<'setup' | 'capture'>('setup');
  const [referenceImage, setReferenceImage] = useState<Blob | null>(() => state?.referenceImage ?? null);
  const [referencePreview, setReferencePreview] = useState('');
  const [ghostOpacity, setGhostOpacity] = useState(0.35);
  const [showGrid, setShowGrid] = useState(true);
  const [showThirds, setShowThirds] = useState(false);
  const [showDiagonal, setShowDiagonal] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!referenceImage) return;

    let active = true;
    blobToDataURL(referenceImage).then((url) => {
      if (active) setReferencePreview(url);
    });

    return () => {
      active = false;
    };
  }, [referenceImage]);

  useEffect(() => {
    if (step === 'capture') {
      start();
    }
    return () => stop();
  }, [step, start, stop]);

  const handleReferenceSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setReferenceImage(file);
  };

  const triggerFlash = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 150);
  };

  const handleCapture = () => {
    if (!referenceImage) return;
    const capturedImage = capture();
    if (!capturedImage) return;
    triggerFlash();
    stop();
    navigate('/preview', {
      state: {
        referenceImage,
        capturedImage,
      },
    });
  };

  const handleBackFromCamera = () => {
    stop();
    setStep('setup');
  };

  if (step === 'setup') {
    return (
      <AppFrame>
        <AppHeader title="基準画像を選択" onBack={() => navigate('/home')} backLabel="ホーム" />

        <div className="flex-1 space-y-5 overflow-y-auto px-1 pb-2 pt-1 animate-slide-up">
          <div className="rounded-[16px] border border-[#B9A7FF]/30 bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_10px_28px_rgba(85,70,180,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_16px_34px_-26px_rgba(45,74,152,0.85)]">
            <p className="text-sm font-semibold text-[#161B5C] dark:text-slate-100">合わせたい画像を選ぶ</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6B6F8A] dark:text-slate-400">
              過去の写真や参考画像を選ぶと、撮影中に半透明で重ねて表示されます。画像はアプリ内に保存されません。
            </p>

            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[#6B4CFF]/60 bg-white px-4 py-3 text-sm font-bold text-[#6B4CFF] shadow-[0_10px_28px_rgba(85,70,180,0.10)] transition-all hover:bg-[#F4F2FF] active:scale-[0.99] dark:border-indigo-300/20 dark:bg-slate-900/45 dark:text-slate-100">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75A2.25 2.25 0 016 4.5h12a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25V6.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 14.25l2.1-2.1a1.5 1.5 0 012.121 0l.558.559a1.5 1.5 0 002.121 0l.6-.6" />
                <circle cx="8.25" cy="8.75" r="1.1" />
              </svg>
              画像を選択
              <input type="file" accept="image/*" className="hidden" onChange={handleReferenceSelect} />
            </label>
          </div>

          {referenceImage && referencePreview ? (
            <div className="animate-slide-up rounded-[16px] border border-[#B9A7FF]/30 bg-[rgba(255,255,255,0.92)] p-3 shadow-[0_12px_32px_rgba(85,70,180,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
              <img
                src={referencePreview}
                alt="選択した基準画像"
                className="max-h-[48vh] w-full rounded-[10px] object-contain bg-slate-950/5 dark:bg-black/30"
              />
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-[#B9A7FF]/50 bg-white/60 px-4 py-12 text-center dark:border-white/10 dark:bg-slate-900/30">
              <p className="text-sm font-medium text-[#6B6F8A] dark:text-slate-400">基準画像がまだ選択されていません</p>
            </div>
          )}

          <div className="rounded-[16px] border border-[#B9A7FF]/30 bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_10px_28px_rgba(85,70,180,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
            <p className="text-[11px] leading-relaxed text-[#6B6F8A] dark:text-slate-400">
              人物や個人情報が写る画像を使う場合は、必要な許可を得たうえで撮影してください。出力前に手動モザイク加工もできます。
            </p>
          </div>

          <button
            onClick={() => setStep('capture')}
            disabled={!referenceImage}
            className="sheen-wrap w-full rounded-[10px] border border-[#8B5CFF]/30 bg-[linear-gradient(135deg,#6B4CFF_0%,#7B54FF_48%,#8B5CFF_100%)] py-4 text-base font-bold text-white shadow-[0_8px_18px_rgba(90,65,230,0.24)] transition-all hover:brightness-105 active:scale-[0.99] disabled:scale-100 disabled:opacity-30"
          >
            撮影を開始する
          </button>
        </div>
      </AppFrame>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black">
      {flash && <div className="absolute inset-0 z-50 bg-white" />}

      <div className="relative z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 py-2.5 text-white backdrop-blur-md">
        <button onClick={handleBackFromCamera} className="flex items-center gap-1 text-sm font-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>
        <span className="text-sm font-semibold tracking-wide">基準画像に合わせて撮影</span>
        <button onClick={switchCamera} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1">
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          autoPlay
          playsInline
          muted
        />

        {referenceImage && <GhostOverlay imageBlob={referenceImage} opacity={ghostOpacity} />}
        <CompositionGuides grid={showGrid} thirds={showThirds} diagonal={showDiagonal} />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-white">
            <p className="font-medium">{error}</p>
          </div>
        )}
      </div>

      <div className="relative z-20 space-y-3 bg-gradient-to-t from-black/95 to-black/70 px-4 py-4">
        <div className="flex items-center gap-3 px-2">
          <span className="whitespace-nowrap text-xs font-medium text-white/70">ゴースト</span>
          <input
            type="range"
            min="0"
            max="85"
            value={ghostOpacity * 100}
            onChange={(e) => setGhostOpacity(Number(e.target.value) / 100)}
            className="flex-1 accent-[#6B4CFF]"
          />
        </div>

        <div className="flex justify-center gap-2">
          <GuideToggle label="グリッド" active={showGrid} onClick={() => setShowGrid((v) => !v)} />
          <GuideToggle label="三分割" active={showThirds} onClick={() => setShowThirds((v) => !v)} />
          <GuideToggle label="斜め線" active={showDiagonal} onClick={() => setShowDiagonal((v) => !v)} />
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={handleCapture}
            disabled={!isReady}
            className="flex h-18 w-18 items-center justify-center rounded-full border-[3px] border-white/60 shadow-lg disabled:opacity-30"
          >
            <div className="h-14 w-14 rounded-full bg-white transition active:bg-slate-200" />
          </button>
        </div>
      </div>
    </div>
  );
}

function GuideToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
        active ? 'bg-[#6B4CFF]/70 text-white' : 'bg-white/10 text-white/45'
      }`}
    >
      {label}
    </button>
  );
}
