import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { useSession } from '../contexts/SessionContext';
import { blobToDataURL } from '../lib/imageProcessor';

export default function CapturePage() {
  const navigate = useNavigate();
  const { videoRef, isReady, error, start, stop, capture, switchCamera, facingMode } = useCamera();
  const { images, addImage } = useSession();

  // Left side: reference image
  const [refSrc, setRefSrc] = useState<string | null>(null);
  const [refBlob, setRefBlob] = useState<Blob | null>(null);
  const [refScale, setRefScale] = useState(1);
  const [refOffset, setRefOffset] = useState({ x: 0, y: 0 });

  // Right side: captured image
  const [capturedSrc, setCapturedSrc] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capScale, setCapScale] = useState(1);
  const [capOffset, setCapOffset] = useState({ x: 0, y: 0 });

  // Which side is selected for adjustment
  const [selectedSide, setSelectedSide] = useState<'left' | 'right'>('left');

  const [flash, setFlash] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Drag state
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  // Pinch state
  const pinchState = useRef<{ initialDist: number; initialScale: number } | null>(null);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  // Select reference image from device
  const handleSelectRef = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRefBlob(file);
    const url = await blobToDataURL(file);
    setRefSrc(url);
    setRefScale(1);
    setRefOffset({ x: 0, y: 0 });
  };

  // Capture right side
  const handleCapture = () => {
    const blob = capture();
    if (!blob) return;
    setFlash(true);
    window.setTimeout(() => setFlash(false), 150);
    setCapturedBlob(blob);
    setCapScale(1);
    setCapOffset({ x: 0, y: 0 });
    addImage(blob);
    blobToDataURL(blob).then(setCapturedSrc);
  };

  // Reshoot
  const handleReshoot = () => {
    setCapturedSrc(null);
    setCapturedBlob(null);
    setCapScale(1);
    setCapOffset({ x: 0, y: 0 });
  };

  const handleBack = () => {
    stop();
    navigate('/home');
  };

  // --- Generic drag for selected side ---
  const handlePointerDown = useCallback((side: 'left' | 'right', e: React.PointerEvent) => {
    setSelectedSide(side);
    const offset = side === 'left' ? refOffset : capOffset;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [refOffset, capOffset]);

  const handlePointerMove = useCallback((side: 'left' | 'right', e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const newOffset = { x: dragState.current.origX + dx, y: dragState.current.origY + dy };
    if (side === 'left') setRefOffset(newOffset);
    else setCapOffset(newOffset);
  }, []);

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  // --- Pinch-to-zoom ---
  const handleTouchStart = useCallback((side: 'left' | 'right', e: React.TouchEvent) => {
    setSelectedSide(side);
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentScale = side === 'left' ? refScale : capScale;
      pinchState.current = {
        initialDist: Math.hypot(dx, dy),
        initialScale: currentScale,
      };
    }
  }, [refScale, capScale]);

  const handleTouchMove = useCallback((side: 'left' | 'right', e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchState.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = pinchState.current.initialScale * (dist / pinchState.current.initialDist);
      const clamped = Math.max(0.3, Math.min(5, scale));
      if (side === 'left') setRefScale(clamped);
      else setCapScale(clamped);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchState.current = null;
  }, []);

  // Zoom buttons for selected side
  const handleZoom = (delta: number) => {
    if (selectedSide === 'left') {
      setRefScale((prev) => Math.max(0.3, Math.min(5, prev + delta)));
    } else {
      setCapScale((prev) => Math.max(0.3, Math.min(5, prev + delta)));
    }
  };

  const handleReset = () => {
    if (selectedSide === 'left') {
      setRefScale(1);
      setRefOffset({ x: 0, y: 0 });
    } else {
      setCapScale(1);
      setCapOffset({ x: 0, y: 0 });
    }
  };

  const currentScale = selectedSide === 'left' ? refScale : capScale;

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
        <span className="text-xs font-semibold tracking-wide">撮影</span>
        <div className="flex items-center gap-1">
          <button onClick={switchCamera} className="rounded-lg p-1.5 transition-colors hover:bg-white/10">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="relative flex flex-1 items-center justify-center bg-black px-1 py-1">
        <div
          className="flex w-full overflow-hidden rounded-lg border border-white/10"
          style={{
            maxWidth: 'min(100vw - 8px, 440px)',
            maxHeight: 'calc(100dvh - 140px)',
            aspectRatio: '3 / 4',
          }}
        >
          {/* Left: Reference Image */}
          <div
            className={`relative flex-1 overflow-hidden border-r border-white/20 bg-slate-900 ${selectedSide === 'left' && refSrc ? 'ring-2 ring-inset ring-[#3DC4A8]' : ''}`}
            onTouchStart={(e) => handleTouchStart('left', e)}
            onTouchMove={(e) => handleTouchMove('left', e)}
            onTouchEnd={handleTouchEnd}
          >
            {refSrc ? (
              <div
                className="absolute inset-0 touch-none select-none overflow-hidden"
                onPointerDown={(e) => handlePointerDown('left', e)}
                onPointerMove={(e) => handlePointerMove('left', e)}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div
                  className="absolute"
                  style={{
                    width: `${100 * refScale}%`,
                    height: `${100 * refScale}%`,
                    left: `calc(${(1 - refScale) * 50}% + ${refOffset.x}px)`,
                    top: `calc(${(1 - refScale) * 50}% + ${refOffset.y}px)`,
                  }}
                >
                  <img
                    src={refSrc}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-cover pointer-events-none"
                  />
                </div>
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  />
                )}
              </div>
            ) : (
              <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-white/50 transition hover:text-white/70">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <span className="text-[10px] font-medium">タップして画像を選択</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleSelectRef} />
              </label>
            )}

            {refSrc && (
              <label className="absolute bottom-1 left-1 z-10 flex cursor-pointer items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[9px] font-medium text-white/80 backdrop-blur transition hover:bg-black/80">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                </svg>
                変更
                <input type="file" accept="image/*" className="hidden" onChange={handleSelectRef} />
              </label>
            )}
          </div>

          {/* Right: Camera / Captured */}
          <div
            className={`relative flex-1 overflow-hidden bg-black ${selectedSide === 'right' && capturedSrc ? 'ring-2 ring-inset ring-[#5BB5E7]' : ''}`}
            onTouchStart={(e) => capturedSrc && handleTouchStart('right', e)}
            onTouchMove={(e) => capturedSrc && handleTouchMove('right', e)}
            onTouchEnd={capturedSrc ? handleTouchEnd : undefined}
          >
            {capturedSrc ? (
              <>
                <div
                  className="absolute inset-0 touch-none select-none overflow-hidden"
                  onPointerDown={(e) => handlePointerDown('right', e)}
                  onPointerMove={(e) => handlePointerMove('right', e)}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <div
                    className="absolute"
                    style={{
                      width: `${100 * capScale}%`,
                      height: `${100 * capScale}%`,
                      left: `calc(${(1 - capScale) * 50}% + ${capOffset.x}px)`,
                      top: `calc(${(1 - capScale) * 50}% + ${capOffset.y}px)`,
                    }}
                  >
                    <img
                      src={capturedSrc}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover pointer-events-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleReshoot}
                  className="absolute bottom-1 right-1 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[9px] font-medium text-white/80 backdrop-blur transition hover:bg-black/80"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  撮り直し
                </button>
              </>
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
                {showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
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
        {/* Zoom controls for selected side */}
        {(refSrc || capturedSrc) && (
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className={`text-[9px] font-medium ${selectedSide === 'left' ? 'text-[#3DC4A8]' : 'text-white/40'}`}>
              {selectedSide === 'left' ? '左画像 選択中' : '左画像'}
            </span>
            <span className="text-white/20">|</span>
            <span className={`text-[9px] font-medium ${selectedSide === 'right' ? 'text-[#5BB5E7]' : 'text-white/40'}`}>
              {selectedSide === 'right' ? '右画像 選択中' : '右画像'}
            </span>
            <span className="text-white/20">|</span>
            <button onClick={() => handleZoom(-0.1)} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/70">-</button>
            <span className="text-[9px] text-white/50 w-8 text-center">{Math.round(currentScale * 100)}%</span>
            <button onClick={() => handleZoom(0.1)} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/70">+</button>
            <button onClick={handleReset} className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/50">リセット</button>
          </div>
        )}

        {/* Main buttons */}
        <div className="flex items-center justify-between">
          {/* Grid toggle */}
          <button
            onClick={() => setShowGrid((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              showGrid ? 'bg-[#3DC4A8]/70 text-white' : 'bg-white/10 text-white/45'
            }`}
          >
            グリッド
          </button>

          {/* Shutter */}
          <button
            onClick={handleCapture}
            disabled={!isReady || !!capturedSrc}
            className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white/60 shadow-lg disabled:opacity-30"
          >
            <div className="h-12 w-12 rounded-full bg-white transition active:bg-slate-200" />
          </button>

          {/* Compare / Gallery */}
          {refBlob && capturedBlob ? (
            <button
              onClick={() => {
                stop();
                navigate('/compare', { state: { firstBlob: refBlob, secondBlob: capturedBlob } });
              }}
              className="rounded-full bg-[#3DC4A8]/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-[#3DC4A8] active:scale-[0.97]"
            >
              比較保存
            </button>
          ) : (
            <button
              onClick={() => { stop(); navigate('/gallery'); }}
              disabled={images.length === 0}
              className="relative rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-white/25 disabled:opacity-30"
            >
              一覧
              {images.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3DC4A8] text-[9px] font-bold text-white">
                  {images.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
