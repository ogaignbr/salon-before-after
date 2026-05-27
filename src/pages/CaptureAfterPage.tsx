import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { shareOrDownloadImage } from '../lib/imageProcessor';

export default function CaptureAfterPage() {
  const navigate = useNavigate();
  const { videoRef, isReady, error, start, stop, capture, switchCamera, facingMode } = useCamera();

  // Before image (picked from device)
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [beforeScale, setBeforeScale] = useState(1);
  const [beforeOffset, setBeforeOffset] = useState({ x: 0, y: 0 });

  // After capture
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  const [flash, setFlash] = useState(false);
  type GridMode = 'off' | 'white' | 'red';
  const [gridMode, setGridMode] = useState<GridMode>('white');
  const cycleGrid = () => setGridMode((v) => v === 'off' ? 'white' : v === 'white' ? 'red' : 'off');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag state for before image
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const pinchState = useRef<{ initialDist: number; initialScale: number } | null>(null);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // Clean up URLs
  useEffect(() => {
    return () => {
      if (beforeUrl) URL.revokeObjectURL(beforeUrl);
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [beforeUrl, capturedUrl]);

  const handlePickBefore = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (beforeUrl) URL.revokeObjectURL(beforeUrl);
    setBeforeUrl(URL.createObjectURL(file));
    setBeforeScale(1);
    setBeforeOffset({ x: 0, y: 0 });
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleCapture = useCallback(() => {
    const blob = capture();
    if (!blob) return;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 150);
    setCapturedBlob(blob);
    setCapturedUrl(URL.createObjectURL(blob));
    stop();
  }, [capture, stop]);

  const handleRetake = useCallback(() => {
    setCapturedBlob(null);
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    start();
  }, [start, capturedUrl]);

  const handleSave = useCallback(async () => {
    if (!capturedBlob) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    await shareOrDownloadImage(capturedBlob, `pitacame_after_${stamp}.jpg`);
  }, [capturedBlob]);

  const handleBack = () => {
    stop();
    navigate('/home');
  };

  // --- Drag for before image ---
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: beforeOffset.x,
      origY: beforeOffset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [beforeOffset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setBeforeOffset({ x: dragState.current.origX + dx, y: dragState.current.origY + dy });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  // --- Pinch-to-zoom for before image ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchState.current = {
        initialDist: Math.hypot(dx, dy),
        initialScale: beforeScale,
      };
    }
  }, [beforeScale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchState.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = pinchState.current.initialScale * (dist / pinchState.current.initialDist);
      setBeforeScale(Math.max(0.3, Math.min(5, scale)));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchState.current = null;
  }, []);

  const handleZoom = (delta: number) => {
    setBeforeScale((prev) => Math.max(0.3, Math.min(5, prev + delta)));
  };

  const handleReset = () => {
    setBeforeScale(1);
    setBeforeOffset({ x: 0, y: 0 });
  };

  return (
    <div className="relative flex flex-col overflow-hidden bg-black" style={{ height: '100dvh' }}>
      {flash && <div className="absolute inset-0 z-50 bg-white" />}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-3 py-2 text-white backdrop-blur-md" style={{ flexShrink: 0 }}>
        <button onClick={handleBack} className="flex items-center gap-1 text-xs font-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          ホーム
        </button>
        <span className="text-xs font-semibold tracking-wide">アフターを撮影</span>
        <div className="flex items-center gap-1">
          {!capturedBlob && (
            <button onClick={switchCamera} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Split View */}
      <div className="relative flex flex-1 items-center justify-center bg-black px-1 py-1">
        <div
          className="flex w-full overflow-hidden rounded-lg border border-white/10"
          style={{
            maxWidth: 'min(100vw - 8px, 440px)',
            maxHeight: 'calc(100dvh - 160px)',
            aspectRatio: '3 / 4',
          }}
        >
          {/* Left side - Before image */}
          <div
            className="relative flex-1 overflow-hidden border-r border-white/20 bg-slate-900"
            onTouchStart={beforeUrl ? handleTouchStart : undefined}
            onTouchMove={beforeUrl ? handleTouchMove : undefined}
            onTouchEnd={beforeUrl ? handleTouchEnd : undefined}
          >
            {beforeUrl ? (
              <div
                className="absolute inset-0 touch-none select-none overflow-hidden"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <img
                  src={beforeUrl}
                  alt="ビフォー"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                  style={{
                    transform: `translate(${beforeOffset.x}px, ${beforeOffset.y}px) scale(${beforeScale})`,
                    transformOrigin: 'center',
                  }}
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
              </div>
            ) : (
              <button
                onClick={handlePickBefore}
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/50 transition hover:text-white/70"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <span className="text-[11px] font-medium">ビフォー画像を選択</span>
              </button>
            )}
            {beforeUrl && (
              <button
                onClick={handlePickBefore}
                className="absolute bottom-1 left-1 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[9px] font-medium text-white/80 backdrop-blur transition hover:bg-black/80"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                変更
              </button>
            )}
          </div>

          {/* Right side - Camera / Captured */}
          <div className="relative flex-1 overflow-hidden bg-black">
            {capturedUrl ? (
              <img src={capturedUrl} alt="アフター" className="absolute inset-0 h-full w-full object-cover" />
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
      </div>

      {/* Controls */}
      <div className="relative z-20 bg-gradient-to-t from-black/95 to-black/70 px-3 py-2.5" style={{ flexShrink: 0 }}>
        {/* Zoom controls for before image */}
        {beforeUrl && !capturedBlob && (
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-[9px] font-medium text-[#3DC4A8]">ビフォー画像</span>
            <button onClick={() => handleZoom(-0.1)} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/70">-</button>
            <span className="text-[9px] text-white/50 w-8 text-center">{Math.round(beforeScale * 100)}%</span>
            <button onClick={() => handleZoom(0.1)} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/70">+</button>
            <button onClick={handleReset} className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/50">リセット</button>
          </div>
        )}

        {capturedBlob ? (
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
