import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import GhostOverlay from '../components/GhostOverlay';
import CompositionGuides from '../components/CompositionGuides';
import { cropTo3x4 } from '../lib/imageProcessor';
import { saveReferenceImage, loadReferenceImage, clearReferenceImage } from '../lib/db';

type Step = 'reference' | 'confirm' | 'capture';

export default function CapturePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { referenceImage?: Blob } | null;
  const { videoRef, isReady, error, start, stop, capture, switchCamera, facingMode } = useCamera();
  const [step, setStep] = useState<Step>(() =>
    state?.referenceImage ? 'capture' : 'reference',
  );
  const [referenceImage, setReferenceImage] = useState<Blob | null>(() => state?.referenceImage ?? null);
  const [ghostOpacity, setGhostOpacity] = useState(0.35);
  const [showGrid, setShowGrid] = useState(true);
  const [showThirds, setShowThirds] = useState(false);
  const [showDiagonal, setShowDiagonal] = useState(false);
  const [flash, setFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRef, setLoadingRef] = useState(!state?.referenceImage);

  // On mount, check for a previously saved reference image
  useEffect(() => {
    if (state?.referenceImage) return;
    loadReferenceImage().then((saved) => {
      if (saved) {
        setReferenceImage(saved);
        setStep('confirm');
      }
      setLoadingRef(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step === 'confirm') return; // no camera needed for confirm step
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
    setStep('confirm');
  };

  const handleReferenceSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const cropped = await cropTo3x4(file);
    setReferenceImage(cropped);
    setStep('confirm');
  };

  const handleSaveAndProceed = async () => {
    if (!referenceImage || saving) return;
    setSaving(true);
    await saveReferenceImage(referenceImage);
    setSaving(false);
    setStep('capture');
  };

  const handleRetakeReference = async () => {
    await clearReferenceImage();
    setReferenceImage(null);
    setStep('reference');
  };

  const handleCaptureAfter = () => {
    if (!referenceImage) return;
    const capturedImage = capture();
    if (!capturedImage) return;
    triggerFlash();
    stop();
    clearReferenceImage(); // clear saved reference after successful capture
    navigate('/preview', {
      state: { referenceImage, capturedImage },
    });
  };

  const handleBack = () => {
    stop();
    if (step === 'capture') {
      setStep('confirm');
    } else if (step === 'confirm') {
      clearReferenceImage();
      setReferenceImage(null);
      setStep('reference');
    } else {
      navigate('/home');
    }
  };

  const isReferenceStep = step === 'reference';
  const isConfirmStep = step === 'confirm';
  const title = isReferenceStep
    ? '基準画像を撮影'
    : isConfirmStep
      ? '基準画像の確認'
      : '基準画像に合わせて撮影';
  const backLabel = isReferenceStep ? 'ホーム' : isConfirmStep ? '撮り直す' : '基準確認';

  const referenceUrl = useMemo(
    () => (referenceImage ? URL.createObjectURL(referenceImage) : null),
    [referenceImage],
  );
  useEffect(() => {
    return () => { if (referenceUrl) URL.revokeObjectURL(referenceUrl); };
  }, [referenceUrl]);

  if (loadingRef) {
    return <div className="flex h-dvh items-center justify-center bg-black text-white text-sm">読み込み中...</div>;
  }

  // Confirm step: show saved reference image for review
  if (isConfirmStep && referenceUrl) {
    return (
      <div className="relative flex h-dvh flex-col overflow-hidden bg-black">
        <div className="relative z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-4 py-2.5 text-white backdrop-blur-md">
          <button onClick={handleBack} className="flex items-center gap-1 text-sm font-medium">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </button>
          <span className="text-sm font-semibold tracking-wide">{title}</span>
          <div className="w-8" />
        </div>

        <div className="relative flex-1 flex items-center justify-center bg-black">
          <div className="relative w-full aspect-[3/4] max-h-full overflow-hidden">
            <img src={referenceUrl} alt="基準画像" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        </div>

        <div className="relative z-20 space-y-3 bg-gradient-to-t from-black/95 to-black/70 px-4 py-5">
          <p className="text-center text-sm font-medium text-white">
            この画像を基準画像として保存しますか？
          </p>
          <p className="text-center text-xs text-white/50">
            保存すると、アプリを閉じても基準画像が残ります
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={handleRetakeReference}
              className="flex h-12 items-center gap-1.5 rounded-full bg-white/15 px-5 text-sm font-medium text-white/80 backdrop-blur transition hover:bg-white/25 active:scale-[0.97]"
            >
              撮り直す
            </button>
            <button
              onClick={handleSaveAndProceed}
              disabled={saving}
              className="flex h-12 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] px-6 text-sm font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存して撮影へ'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <CompositionGuides grid={showGrid} thirds={showThirds} diagonal={showDiagonal} />

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-white">
              <p className="font-medium">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-20 space-y-3 bg-gradient-to-t from-black/95 to-black/70 px-4 py-4">
        {!isReferenceStep && (
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
        )}

        <div className="flex justify-center gap-2">
          <GuideToggle label="グリッド" active={showGrid} onClick={() => setShowGrid((v) => !v)} />
          <GuideToggle label="三分割" active={showThirds} onClick={() => setShowThirds((v) => !v)} />
          <GuideToggle label="斜め線" active={showDiagonal} onClick={() => setShowDiagonal((v) => !v)} />
        </div>

        {isReferenceStep && (
          <p className="text-center text-xs text-white/60">
            基準となる写真を撮影、または過去の画像を選択してください
          </p>
        )}

        <div className="flex items-center justify-center gap-6">
          {isReferenceStep && (
            <label className="flex h-12 cursor-pointer items-center gap-1.5 rounded-full bg-white/15 px-4 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-white/25 active:scale-[0.97]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75A2.25 2.25 0 016 4.5h12a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0118 19.5H6a2.25 2.25 0 01-2.25-2.25V6.75z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 14.25l2.1-2.1a1.5 1.5 0 012.121 0l.558.559a1.5 1.5 0 002.121 0l.6-.6" />
              </svg>
              画像を選択
              <input type="file" accept="image/*" className="hidden" onChange={handleReferenceSelect} />
            </label>
          )}

          <button
            onClick={isReferenceStep ? handleCaptureReference : handleCaptureAfter}
            disabled={!isReady}
            className="flex h-18 w-18 items-center justify-center rounded-full border-[3px] border-white/60 shadow-lg disabled:opacity-30"
          >
            <div className="h-14 w-14 rounded-full bg-white transition active:bg-slate-200" />
          </button>

          {isReferenceStep && <div className="w-[108px]" />}
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
