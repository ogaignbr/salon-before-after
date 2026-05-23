import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import GhostOverlay from '../components/GhostOverlay';
import CompositionGuides from '../components/CompositionGuides';

export default function CapturePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { referenceImage?: Blob } | null;
  const { videoRef, isReady, error, start, stop, capture, switchCamera, facingMode } = useCamera();
  const [step, setStep] = useState<'reference' | 'capture'>(() =>
    state?.referenceImage ? 'capture' : 'reference',
  );
  const [referenceImage, setReferenceImage] = useState<Blob | null>(() => state?.referenceImage ?? null);
  const [ghostOpacity, setGhostOpacity] = useState(0.35);
  const [showGrid, setShowGrid] = useState(true);
  const [showThirds, setShowThirds] = useState(false);
  const [showDiagonal, setShowDiagonal] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    start();
    return () => stop();
  }, [step, start, stop]);

  const triggerFlash = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 150);
  };

  const handleCaptureReference = () => {
    const blob = capture();
    if (!blob) return;
    triggerFlash();
    setReferenceImage(blob);
    setStep('capture');
  };

  const handleCaptureAfter = () => {
    if (!referenceImage) return;
    const capturedImage = capture();
    if (!capturedImage) return;
    triggerFlash();
    stop();
    navigate('/preview', {
      state: { referenceImage, capturedImage },
    });
  };

  const handleBack = () => {
    stop();
    if (step === 'capture') {
      setReferenceImage(null);
      setStep('reference');
    } else {
      navigate('/home');
    }
  };

  const isReferenceStep = step === 'reference';
  const title = isReferenceStep ? '基準画像を撮影' : '基準画像に合わせて撮影';
  const backLabel = isReferenceStep ? 'ホーム' : '基準撮影';

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black">
      {flash && <div className="absolute inset-0 z-50 bg-white" />}

      <div className="relative z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 py-2.5 text-white backdrop-blur-md">
        <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </button>
        <span className="text-sm font-semibold tracking-wide">{title}</span>
        <button onClick={switchCamera} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center bg-black">
        <div className="relative w-full aspect-[3/4] max-h-full overflow-hidden">
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            autoPlay
            playsInline
            muted
          />

          {!isReferenceStep && referenceImage && (
            <GhostOverlay imageBlob={referenceImage} opacity={ghostOpacity} />
          )}
          {!isReferenceStep && (
            <CompositionGuides grid={showGrid} thirds={showThirds} diagonal={showDiagonal} />
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-white">
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-20 space-y-3 bg-gradient-to-t from-black/95 to-black/70 px-4 py-4">
        {!isReferenceStep && (
          <>
            <div className="flex items-center gap-3 px-2">
              <span className="whitespace-nowrap text-xs font-medium text-white/70">ゴースト</span>
              <input
                type="range"
                min="0"
                max="85"
                value={ghostOpacity * 100}
                onChange={(e) => setGhostOpacity(Number(e.target.value) / 100)}
                className="flex-1 accent-[#3DC4A8]"
              />
            </div>

            <div className="flex justify-center gap-2">
              <GuideToggle label="グリッド" active={showGrid} onClick={() => setShowGrid((v) => !v)} />
              <GuideToggle label="三分割" active={showThirds} onClick={() => setShowThirds((v) => !v)} />
              <GuideToggle label="斜め線" active={showDiagonal} onClick={() => setShowDiagonal((v) => !v)} />
            </div>
          </>
        )}

        {isReferenceStep && (
          <p className="text-center text-xs text-white/60">
            まず基準となる写真を撮影してください
          </p>
        )}

        <div className="flex items-center justify-center">
          <button
            onClick={isReferenceStep ? handleCaptureReference : handleCaptureAfter}
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
        active ? 'bg-[#3DC4A8]/70 text-white' : 'bg-white/10 text-white/45'
      }`}
    >
      {label}
    </button>
  );
}
