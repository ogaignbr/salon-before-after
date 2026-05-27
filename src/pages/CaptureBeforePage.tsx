import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { shareOrDownloadImage } from '../lib/imageProcessor';

export default function CaptureBeforePage() {
  const navigate = useNavigate();
  const { videoRef, isReady, error, start, stop, capture, switchCamera, facingMode } = useCamera();

  const [flash, setFlash] = useState(false);
  const [captured, setCaptured] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  type GridMode = 'off' | 'white' | 'red';
  const [gridMode, setGridMode] = useState<GridMode>('white');
  const cycleGrid = () => setGridMode((v) => v === 'off' ? 'white' : v === 'white' ? 'red' : 'off');

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCapture = useCallback(() => {
    const blob = capture();
    if (!blob) return;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 150);
    setCaptured(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    stop();
  }, [capture, stop]);

  const handleRetake = useCallback(() => {
    setCaptured(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    start();
  }, [start, previewUrl]);

  const handleSave = useCallback(async () => {
    if (!captured) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    await shareOrDownloadImage(captured, `pitacame_before_${stamp}.jpg`);
  }, [captured]);

  const handleBack = () => {
    stop();
    navigate('/home');
  };

  return (
    <div className="relative flex flex-col overflow-hidden bg-black" style={{ height: '100dvh' }}>
      {flash && <div className="absolute inset-0 z-50 bg-white" />}

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-3 py-2 text-white backdrop-blur-md" style={{ flexShrink: 0 }}>
        <button onClick={handleBack} className="flex items-center gap-1 text-xs font-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          ホーム
        </button>
        <span className="text-xs font-semibold tracking-wide">ビフォーを撮影</span>
        <div className="flex items-center gap-1">
          {!captured && (
            <button onClick={switchCamera} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Camera / Preview */}
      <div className="relative flex flex-1 items-center justify-center bg-black px-1 py-1">
        <div
          className="relative overflow-hidden rounded-lg border border-white/10"
          style={{
            maxWidth: 'min(100vw - 8px, 440px)',
            maxHeight: 'calc(100dvh - 140px)',
            aspectRatio: '3 / 4',
            width: '100%',
          }}
        >
          {captured && previewUrl ? (
            <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined, background: '#000' }}
                autoPlay
                playsInline
                muted
              />
              {gridMode !== 'off' && (
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    backgroundImage:
                      gridMode === 'red'
                        ? 'linear-gradient(rgba(255,0,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.35) 1px, transparent 1px)'
                        : 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-2 text-center text-white">
                  <p className="text-xs font-medium">{error}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-20 bg-gradient-to-t from-black/95 to-black/70 px-3 py-2.5" style={{ flexShrink: 0 }}>
        {captured ? (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRetake}
              className="rounded-full bg-white/15 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/25 active:scale-[0.97]"
            >
              撮り直し
            </button>
            <button
              onClick={handleSave}
              className="rounded-full bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.97]"
            >
              端末に保存
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={cycleGrid}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                gridMode === 'off' ? 'bg-white/10 text-white/45' : gridMode === 'red' ? 'bg-red-500/70 text-white' : 'bg-[#3DC4A8]/70 text-white'
              }`}
            >
              {gridMode === 'off' ? 'グリッド' : gridMode === 'white' ? 'グリッド(白)' : 'グリッド(赤)'}
            </button>

            <button
              onClick={handleCapture}
              disabled={!isReady}
              className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white/60 shadow-lg disabled:opacity-30"
            >
              <div className="h-12 w-12 rounded-full bg-white transition active:bg-slate-200" />
            </button>

            <div className="w-16" />
          </div>
        )}
      </div>
    </div>
  );
}
