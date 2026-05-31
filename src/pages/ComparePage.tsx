import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createComparisonImage, createComparisonVideo, shareOrDownloadImage, shareOrDownloadVideo } from '../lib/imageProcessor';
import MosaicCanvas from '../components/MosaicCanvas';
import type { CompareFrameRatio, CompareFrameSettings } from '../types';

type CompareMode = 'photo' | 'video';

const RATIO_OPTIONS: { value: CompareFrameRatio; label: string }[] = [
  { value: '3:4', label: '3:4 縦長' },
  { value: '9:16', label: '9:16 縦長' },
  { value: '4:3', label: '4:3 横長' },
];

const RATIO_CSS: Record<CompareFrameRatio, string> = {
  '3:4': '3 / 4',
  '9:16': '9 / 16',
  '4:3': '4 / 3',
};

const RATIO_VALUES: Record<string, number> = {
  '3:4': 3 / 4,
  '9:16': 9 / 16,
  '4:3': 4 / 3,
};

const PRESET_COLORS = ['#ffffff', '#000000', '#3DC4A8', '#5BB5E7', '#E5486D', '#F59E0B'];

type GridMode = 'off' | 'white' | 'red';
const GRID_CYCLE: Record<GridMode, GridMode> = { off: 'white', white: 'red', red: 'off' };
const GRID_LABELS: Record<GridMode, string> = { off: 'グリッド', white: '白グリッド', red: '赤グリッド' };

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replaceAll('-', '');
}

export default function ComparePage() {
  const navigate = useNavigate();

  // Images picked from device
  const [firstBlob, setFirstBlob] = useState<Blob | null>(null);
  const [firstUrl, setFirstUrl] = useState<string | null>(null);
  const [secondBlob, setSecondBlob] = useState<Blob | null>(null);
  const [secondUrl, setSecondUrl] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);
  const secondInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<CompareFrameSettings>({
    ratio: '3:4',
    layout: 'horizontal',
    borderEnabled: true,
    borderWidth: 2,
    borderColor: '#ffffff',
    dividerWidth: 2,
    borderRadius: 0,
  });

  const [selectedSide, setSelectedSide] = useState<'first' | 'second' | null>(null);
  const [firstScale, setFirstScale] = useState(1);
  const [firstOffset, setFirstOffset] = useState({ x: 0, y: 0 });
  const [secondScale, setSecondScale] = useState(1);
  const [secondOffset, setSecondOffset] = useState({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [editingMosaic, setEditingMosaic] = useState<'first' | 'second' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [gridMode, setGridMode] = useState<GridMode>('off');
  const [mode, setMode] = useState<CompareMode>('photo');

  // Override blobs for mosaic-edited images
  const [firstBlobOverride, setFirstBlobOverride] = useState<Blob | null>(null);
  const [secondBlobOverride, setSecondBlobOverride] = useState<Blob | null>(null);

  // Video state
  const firstVideoRef = useRef<HTMLVideoElement>(null);
  const secondVideoRef = useRef<HTMLVideoElement>(null);
  const [firstDuration, setFirstDuration] = useState(0);
  const [secondDuration, setSecondDuration] = useState(0);
  const [firstStart, setFirstStart] = useState(0);
  const [firstEnd, setFirstEnd] = useState(0);
  const [secondStart, setSecondStart] = useState(0);
  const [secondEnd, setSecondEnd] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const effectiveFirstBlob = firstBlobOverride ?? firstBlob;
  const effectiveSecondBlob = secondBlobOverride ?? secondBlob;

  const clearAll = useCallback(() => {
    if (firstUrl) URL.revokeObjectURL(firstUrl);
    if (secondUrl) URL.revokeObjectURL(secondUrl);
    setFirstBlob(null); setFirstUrl(null); setFirstBlobOverride(null);
    setSecondBlob(null); setSecondUrl(null); setSecondBlobOverride(null);
    setFirstScale(1); setFirstOffset({ x: 0, y: 0 });
    setSecondScale(1); setSecondOffset({ x: 0, y: 0 });
    setSelectedSide(null);
    setFirstDuration(0); setFirstStart(0); setFirstEnd(0);
    setSecondDuration(0); setSecondStart(0); setSecondEnd(0);
    setIsPlaying(false);
  }, [firstUrl, secondUrl]);

  const switchMode = useCallback((next: CompareMode) => {
    if (next === mode) return;
    clearAll();
    setMode(next);
  }, [mode, clearAll]);

  useEffect(() => {
    return () => {
      if (firstUrl) URL.revokeObjectURL(firstUrl);
      if (secondUrl) URL.revokeObjectURL(secondUrl);
    };
  }, [firstUrl, secondUrl]);

  const handlePickFirst = () => firstInputRef.current?.click();
  const handlePickSecond = () => secondInputRef.current?.click();

  const handleFirstFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (firstUrl) URL.revokeObjectURL(firstUrl);
    setFirstBlob(file);
    setFirstUrl(URL.createObjectURL(file));
    setFirstBlobOverride(null);
    setFirstScale(1);
    setFirstOffset({ x: 0, y: 0 });
    setFirstDuration(0); setFirstStart(0); setFirstEnd(0);
    setIsPlaying(false);
    e.target.value = '';
  };

  const handleSecondFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (secondUrl) URL.revokeObjectURL(secondUrl);
    setSecondBlob(file);
    setSecondUrl(URL.createObjectURL(file));
    setSecondBlobOverride(null);
    setSecondScale(1);
    setSecondOffset({ x: 0, y: 0 });
    setSecondDuration(0); setSecondStart(0); setSecondEnd(0);
    setIsPlaying(false);
    e.target.value = '';
  };

  // Auto-pause at trim end while playing
  useEffect(() => {
    if (!isPlaying || mode !== 'video') return;
    const id = window.setInterval(() => {
      const v1 = firstVideoRef.current;
      const v2 = secondVideoRef.current;
      if (v1 && firstEnd > 0 && v1.currentTime >= firstEnd && !v1.paused) v1.pause();
      if (v2 && secondEnd > 0 && v2.currentTime >= secondEnd && !v2.paused) v2.pause();
      const aDone = !v1 || v1.paused;
      const bDone = !v2 || v2.paused;
      if (aDone && bDone) setIsPlaying(false);
    }, 80);
    return () => window.clearInterval(id);
  }, [isPlaying, firstEnd, secondEnd, mode]);

  const handlePlayPause = useCallback(async () => {
    const v1 = firstVideoRef.current;
    const v2 = secondVideoRef.current;
    if (!v1 && !v2) return;
    if (isPlaying) {
      v1?.pause(); v2?.pause();
      setIsPlaying(false);
    } else {
      if (v1 && (v1.currentTime < firstStart || v1.currentTime >= firstEnd)) v1.currentTime = firstStart;
      if (v2 && (v2.currentTime < secondStart || v2.currentTime >= secondEnd)) v2.currentTime = secondStart;
      try {
        await Promise.all([v1?.play(), v2?.play()].filter(Boolean) as Promise<void>[]);
        setIsPlaying(true);
      } catch {/* ignore */}
    }
  }, [isPlaying, firstStart, firstEnd, secondStart, secondEnd]);

  const handleRewind = useCallback(() => {
    const v1 = firstVideoRef.current;
    const v2 = secondVideoRef.current;
    v1?.pause(); v2?.pause();
    if (v1) v1.currentTime = firstStart;
    if (v2) v2.currentTime = secondStart;
    setIsPlaying(false);
  }, [firstStart, secondStart]);

  const handleFirstStart = (v: number) => {
    const clamped = Math.min(v, Math.max(0, firstEnd - 0.1));
    setFirstStart(clamped);
    if (firstVideoRef.current) firstVideoRef.current.currentTime = clamped;
  };
  const handleFirstEnd = (v: number) => {
    const clamped = Math.max(v, firstStart + 0.1);
    setFirstEnd(clamped);
    if (firstVideoRef.current) firstVideoRef.current.currentTime = clamped;
  };
  const handleSecondStart = (v: number) => {
    const clamped = Math.min(v, Math.max(0, secondEnd - 0.1));
    setSecondStart(clamped);
    if (secondVideoRef.current) secondVideoRef.current.currentTime = clamped;
  };
  const handleSecondEnd = (v: number) => {
    const clamped = Math.max(v, secondStart + 0.1);
    setSecondEnd(clamped);
    if (secondVideoRef.current) secondVideoRef.current.currentTime = clamped;
  };

  // Drag state
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handlePointerDown = useCallback((side: 'first' | 'second', e: React.PointerEvent) => {
    setSelectedSide(side);
    const offset = side === 'first' ? firstOffset : secondOffset;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [firstOffset, secondOffset]);

  const handlePointerMove = useCallback((side: 'first' | 'second', e: React.PointerEvent) => {
    if (!dragRef.current || selectedSide !== side) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newOffset = { x: dragRef.current.origX + dx, y: dragRef.current.origY + dy };
    if (side === 'first') setFirstOffset(newOffset);
    else setSecondOffset(newOffset);
  }, [selectedSide]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Pinch-to-zoom
  const pinchRef = useRef<{ initialDist: number; initialScale: number } | null>(null);

  const handleTouchStart = useCallback((side: 'first' | 'second', e: React.TouchEvent) => {
    setSelectedSide(side);
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentScale = side === 'first' ? firstScale : secondScale;
      pinchRef.current = { initialDist: Math.hypot(dx, dy), initialScale: currentScale };
    }
  }, [firstScale, secondScale]);

  const handleTouchMove = useCallback((side: 'first' | 'second', e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = pinchRef.current.initialScale * (dist / pinchRef.current.initialDist);
      const clamped = Math.max(0.3, Math.min(5, scale));
      if (side === 'first') setFirstScale(clamped);
      else setSecondScale(clamped);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  const handleZoom = (delta: number) => {
    if (!selectedSide) return;
    const setter = selectedSide === 'first' ? setFirstScale : setSecondScale;
    setter((prev) => Math.max(0.3, Math.min(5, prev + delta)));
  };

  const handleReset = () => {
    setFirstScale(1);
    setFirstOffset({ x: 0, y: 0 });
    setSecondScale(1);
    setSecondOffset({ x: 0, y: 0 });
  };

  const buildOptions = (drawGrid: boolean, gridColor?: string) => ({
    layout: settings.layout,
    ratio: settings.ratio,
    borderEnabled: settings.borderEnabled,
    borderWidth: settings.borderWidth,
    borderColor: settings.borderColor,
    dividerWidth: settings.dividerWidth,
    borderRadius: settings.borderRadius,
    firstScale,
    firstOffsetX: firstOffset.x,
    firstOffsetY: firstOffset.y,
    secondScale,
    secondOffsetX: secondOffset.x,
    secondOffsetY: secondOffset.y,
    drawGrid,
    gridColor,
    firstStart,
    firstEnd: firstEnd > 0 ? firstEnd : undefined,
    secondStart,
    secondEnd: secondEnd > 0 ? secondEnd : undefined,
  });

  const handleSave = async (withGrid: boolean) => {
    if (!effectiveFirstBlob || !effectiveSecondBlob) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const suffix = withGrid ? 'grid' : 'clean';
      const gridColor = gridMode === 'red' ? 'red' : 'white';
      if (mode === 'photo') {
        const blob = await createComparisonImage(effectiveFirstBlob, effectiveSecondBlob, buildOptions(withGrid, gridColor));
        await shareOrDownloadImage(blob, `pitacame_compare_${suffix}_${dateStamp()}.jpg`);
      } else {
        const blob = await createComparisonVideo(
          effectiveFirstBlob, effectiveSecondBlob,
          buildOptions(withGrid, gridColor),
          (p) => setExportProgress(p),
        );
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        await shareOrDownloadVideo(blob, `pitacame_compare_video_${suffix}_${dateStamp()}.${ext}`);
      }
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleSaveBoth = async () => {
    if (!effectiveFirstBlob || !effectiveSecondBlob) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const gridColor = gridMode === 'red' ? 'red' : 'white';
      if (mode === 'photo') {
        const [blobClean, blobGrid] = await Promise.all([
          createComparisonImage(effectiveFirstBlob, effectiveSecondBlob, buildOptions(false)),
          createComparisonImage(effectiveFirstBlob, effectiveSecondBlob, buildOptions(true, gridColor)),
        ]);
        await shareOrDownloadImage(blobClean, `pitacame_compare_clean_${dateStamp()}.jpg`);
        await new Promise((r) => setTimeout(r, 500));
        await shareOrDownloadImage(blobGrid, `pitacame_compare_grid_${dateStamp()}.jpg`);
      } else {
        // Videos: render sequentially (each requires real-time playback)
        const blobClean = await createComparisonVideo(
          effectiveFirstBlob, effectiveSecondBlob,
          buildOptions(false),
          (p) => setExportProgress(p / 2),
        );
        const blobGrid = await createComparisonVideo(
          effectiveFirstBlob, effectiveSecondBlob,
          buildOptions(true, gridColor),
          (p) => setExportProgress(0.5 + p / 2),
        );
        const extClean = blobClean.type.includes('mp4') ? 'mp4' : 'webm';
        const extGrid = blobGrid.type.includes('mp4') ? 'mp4' : 'webm';
        await shareOrDownloadVideo(blobClean, `pitacame_compare_video_clean_${dateStamp()}.${extClean}`);
        await new Promise((r) => setTimeout(r, 500));
        await shareOrDownloadVideo(blobGrid, `pitacame_compare_video_grid_${dateStamp()}.${extGrid}`);
      }
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  if (editingMosaic) {
    const blob = editingMosaic === 'first' ? effectiveFirstBlob : effectiveSecondBlob;
    if (!blob) {
      setEditingMosaic(null);
      return null;
    }
    return (
      <MosaicCanvas
        imageBlob={blob}
        onSave={(edited) => {
          if (editingMosaic === 'first') setFirstBlobOverride(edited);
          else setSecondBlobOverride(edited);
          setEditingMosaic(null);
        }}
        onCancel={() => setEditingMosaic(null)}
      />
    );
  }

  const isHorizontal = settings.layout === 'horizontal';
  const canExport = !!effectiveFirstBlob && !!effectiveSecondBlob;

  // Generate display URLs for mosaic overrides
  const displayFirstUrl = firstBlobOverride ? URL.createObjectURL(firstBlobOverride) : firstUrl;
  const displaySecondUrl = secondBlobOverride ? URL.createObjectURL(secondBlobOverride) : secondUrl;

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      <input ref={firstInputRef} type="file" accept={mode === 'photo' ? 'image/*' : 'video/*'} className="hidden" onChange={handleFirstFile} />
      <input ref={secondInputRef} type="file" accept={mode === 'photo' ? 'image/*' : 'video/*'} className="hidden" onChange={handleSecondFile} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-3 py-2 backdrop-blur-md" style={{ flexShrink: 0 }}>
        <button onClick={() => navigate('/home')} className="flex items-center gap-1 text-xs font-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          ホーム
        </button>
        <span className="text-xs font-semibold">ビフォーアフターを並べる</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setGridMode((v) => GRID_CYCLE[v])}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
              gridMode !== 'off' ? 'bg-[#3DC4A8]/70 text-white' : 'bg-white/10 text-white/45'
            }`}
          >
            {GRID_LABELS[gridMode]}
          </button>
          <button
            onClick={() => setShowSettings((v) => !v)}
            className={`rounded-lg p-1.5 transition ${showSettings ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center justify-center gap-2 bg-slate-900/70 px-3 py-2" style={{ flexShrink: 0 }}>
        <div className="flex rounded-full bg-white/10 p-0.5">
          <button
            onClick={() => switchMode('photo')}
            className={`rounded-full px-4 py-1 text-[11px] font-semibold transition ${mode === 'photo' ? 'bg-[#3DC4A8] text-white' : 'text-white/60'}`}
          >
            写真
          </button>
          <button
            onClick={() => switchMode('video')}
            className={`rounded-full px-4 py-1 text-[11px] font-semibold transition ${mode === 'video' ? 'bg-red-500/80 text-white' : 'text-white/60'}`}
          >
            動画
          </button>
        </div>
      </div>

      {/* Layout & Ratio toggles */}
      <div className="flex items-center justify-center gap-2 bg-slate-900/60 px-3 py-2" style={{ flexShrink: 0 }}>
        <div className="flex rounded-full bg-white/10 p-0.5">
          <button
            onClick={() => setSettings((s) => ({ ...s, layout: 'horizontal' }))}
            className={`rounded-full px-3 py-1 text-[10px] font-medium transition ${isHorizontal ? 'bg-[#3DC4A8] text-white' : 'text-white/60'}`}
          >
            左右
          </button>
          <button
            onClick={() => setSettings((s) => ({ ...s, layout: 'vertical' }))}
            className={`rounded-full px-3 py-1 text-[10px] font-medium transition ${!isHorizontal ? 'bg-[#3DC4A8] text-white' : 'text-white/60'}`}
          >
            上下
          </button>
        </div>
        <div className="h-4 w-px bg-white/20" />
        {RATIO_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSettings((s) => ({ ...s, ratio: opt.value }))}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
              settings.ratio === opt.value ? 'bg-[#5BB5E7] text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Video play / trim controls */}
      {mode === 'video' && (firstDuration > 0 || secondDuration > 0) && (
        <div className="space-y-1.5 border-b border-white/10 bg-slate-900/70 px-3 py-2" style={{ flexShrink: 0 }}>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleRewind}
              className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-white/80"
            >
              ⏮ 最初へ
            </button>
            <button
              onClick={handlePlayPause}
              className={`rounded-full px-4 py-1 text-[11px] font-bold text-white ${isPlaying ? 'bg-red-500/80' : 'bg-[#3DC4A8]'}`}
            >
              {isPlaying ? '⏸ 停止' : '▶ 再生'}
            </button>
          </div>
          {firstDuration > 0 && (
            <TrimRow
              label="1枚目"
              accent="#3DC4A8"
              duration={firstDuration}
              start={firstStart}
              end={firstEnd}
              onStartChange={handleFirstStart}
              onEndChange={handleFirstEnd}
            />
          )}
          {secondDuration > 0 && (
            <TrimRow
              label="2枚目"
              accent="#5BB5E7"
              duration={secondDuration}
              start={secondStart}
              end={secondEnd}
              onStartChange={handleSecondStart}
              onEndChange={handleSecondEnd}
            />
          )}
        </div>
      )}

      {/* Compare Frame */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-1 py-1">
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: RATIO_CSS[settings.ratio],
            maxHeight: '100%',
            maxWidth: '100%',
            width: (RATIO_VALUES[settings.ratio] ?? 0.75) >= 1 ? '100%' : 'auto',
            height: (RATIO_VALUES[settings.ratio] ?? 0.75) < 1 ? '100%' : 'auto',
            display: 'flex',
            flexDirection: isHorizontal ? 'row' : 'column',
            border: settings.borderEnabled ? `${settings.borderWidth}px solid ${settings.borderColor}` : 'none',
            borderRadius: settings.borderRadius > 0 ? `${settings.borderRadius}px` : undefined,
          }}
        >
          {/* First image */}
          <div
            className={`relative overflow-hidden ${selectedSide === 'first' ? 'ring-2 ring-[#3DC4A8]' : ''}`}
            style={{
              flex: 1,
              [isHorizontal ? 'borderRight' : 'borderBottom']: settings.borderEnabled
                ? `${settings.dividerWidth}px solid ${settings.borderColor}`
                : 'none',
            }}
            onPointerDown={displayFirstUrl ? (e) => handlePointerDown('first', e) : undefined}
            onPointerMove={displayFirstUrl ? (e) => handlePointerMove('first', e) : undefined}
            onPointerUp={displayFirstUrl ? handlePointerUp : undefined}
            onTouchStart={displayFirstUrl ? (e) => handleTouchStart('first', e) : undefined}
            onTouchMove={displayFirstUrl ? (e) => handleTouchMove('first', e) : undefined}
            onTouchEnd={displayFirstUrl ? handleTouchEnd : undefined}
          >
            {displayFirstUrl ? (
              mode === 'photo' ? (
                <img
                  src={displayFirstUrl}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain touch-none select-none pointer-events-none"
                  style={{
                    transform: `translate(${firstOffset.x}px, ${firstOffset.y}px) scale(${firstScale})`,
                    transformOrigin: 'center',
                  }}
                />
              ) : (
                <video
                  ref={firstVideoRef}
                  src={displayFirstUrl}
                  muted
                  playsInline
                  preload="auto"
                  onLoadedMetadata={(e) => {
                    const d = e.currentTarget.duration;
                    if (isFinite(d) && d > 0) {
                      setFirstDuration(d);
                      setFirstStart(0);
                      setFirstEnd(d);
                    }
                  }}
                  className="absolute inset-0 h-full w-full object-contain touch-none select-none pointer-events-none"
                  style={{
                    transform: `translate(${firstOffset.x}px, ${firstOffset.y}px) scale(${firstScale})`,
                    transformOrigin: 'center',
                  }}
                />
              )
            ) : (
              <button
                onClick={handlePickFirst}
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/50 transition hover:text-white/70"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <span className="text-[11px] font-medium">{mode === 'photo' ? 'ビフォー画像を選択' : 'ビフォー動画を選択'}</span>
              </button>
            )}
            {displayFirstUrl && (
              <button
                onClick={handlePickFirst}
                className="absolute bottom-1 left-1 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[9px] font-medium text-white/80 backdrop-blur transition hover:bg-black/80"
              >
                変更
              </button>
            )}
            {gridMode !== 'off' && displayFirstUrl && <CellGrid color={gridMode} />}
          </div>

          {/* Second image */}
          <div
            className={`relative overflow-hidden ${selectedSide === 'second' ? 'ring-2 ring-[#5BB5E7]' : ''}`}
            style={{ flex: 1 }}
            onPointerDown={displaySecondUrl ? (e) => handlePointerDown('second', e) : undefined}
            onPointerMove={displaySecondUrl ? (e) => handlePointerMove('second', e) : undefined}
            onPointerUp={displaySecondUrl ? handlePointerUp : undefined}
            onTouchStart={displaySecondUrl ? (e) => handleTouchStart('second', e) : undefined}
            onTouchMove={displaySecondUrl ? (e) => handleTouchMove('second', e) : undefined}
            onTouchEnd={displaySecondUrl ? handleTouchEnd : undefined}
          >
            {displaySecondUrl ? (
              mode === 'photo' ? (
                <img
                  src={displaySecondUrl}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain touch-none select-none pointer-events-none"
                  style={{
                    transform: `translate(${secondOffset.x}px, ${secondOffset.y}px) scale(${secondScale})`,
                    transformOrigin: 'center',
                  }}
                />
              ) : (
                <video
                  ref={secondVideoRef}
                  src={displaySecondUrl}
                  muted
                  playsInline
                  preload="auto"
                  onLoadedMetadata={(e) => {
                    const d = e.currentTarget.duration;
                    if (isFinite(d) && d > 0) {
                      setSecondDuration(d);
                      setSecondStart(0);
                      setSecondEnd(d);
                    }
                  }}
                  className="absolute inset-0 h-full w-full object-contain touch-none select-none pointer-events-none"
                  style={{
                    transform: `translate(${secondOffset.x}px, ${secondOffset.y}px) scale(${secondScale})`,
                    transformOrigin: 'center',
                  }}
                />
              )
            ) : (
              <button
                onClick={handlePickSecond}
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/50 transition hover:text-white/70"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <span className="text-[11px] font-medium">{mode === 'photo' ? 'アフター画像を選択' : 'アフター動画を選択'}</span>
              </button>
            )}
            {displaySecondUrl && (
              <button
                onClick={handlePickSecond}
                className="absolute bottom-1 right-1 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[9px] font-medium text-white/80 backdrop-blur transition hover:bg-black/80"
              >
                変更
              </button>
            )}
            {gridMode !== 'off' && displaySecondUrl && <CellGrid color={gridMode} />}
          </div>
        </div>
      </div>

      {/* Settings panel (collapsible) */}
      {showSettings && (
        <div className="space-y-3 border-t border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur" style={{ flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">枠線</span>
            <button
              onClick={() => setSettings((s) => ({ ...s, borderEnabled: !s.borderEnabled }))}
              className={`relative h-6 w-11 rounded-full transition ${settings.borderEnabled ? 'bg-[#3DC4A8]' : 'bg-white/20'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.borderEnabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {settings.borderEnabled && (
            <>
              <div>
                <label className="text-[10px] text-white/50">枠線の太さ: {settings.borderWidth}px</label>
                <input
                  type="range" min="1" max="10" value={settings.borderWidth}
                  onChange={(e) => setSettings((s) => ({ ...s, borderWidth: Number(e.target.value) }))}
                  className="w-full accent-[#3DC4A8]"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50">区切り線の太さ: {settings.dividerWidth}px</label>
                <input
                  type="range" min="0" max="10" value={settings.dividerWidth}
                  onChange={(e) => setSettings((s) => ({ ...s, dividerWidth: Number(e.target.value) }))}
                  className="w-full accent-[#3DC4A8]"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50">枠線の色</label>
                <div className="mt-1 flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSettings((s) => ({ ...s, borderColor: c }))}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        settings.borderColor === c ? 'border-[#3DC4A8] scale-110' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={settings.borderColor}
                    onChange={(e) => setSettings((s) => ({ ...s, borderColor: e.target.value }))}
                    className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-white/50">角丸: {settings.borderRadius}px</label>
                <input
                  type="range" min="0" max="30" value={settings.borderRadius}
                  onChange={(e) => setSettings((s) => ({ ...s, borderRadius: Number(e.target.value) }))}
                  className="w-full accent-[#3DC4A8]"
                />
              </div>
            </>
          )}

          {mode === 'photo' && (
            <div className="flex gap-2">
              <button
                onClick={() => effectiveFirstBlob && setEditingMosaic('first')}
                disabled={!effectiveFirstBlob}
                className="flex-1 rounded-lg bg-white/10 py-2 text-xs font-medium text-white/80 transition hover:bg-white/20 disabled:opacity-30"
              >
                1枚目 モザイク
              </button>
              <button
                onClick={() => effectiveSecondBlob && setEditingMosaic('second')}
                disabled={!effectiveSecondBlob}
                className="flex-1 rounded-lg bg-white/10 py-2 text-xs font-medium text-white/80 transition hover:bg-white/20 disabled:opacity-30"
              >
                2枚目 モザイク
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom controls */}
      <div className="border-t border-white/10 bg-slate-900/80 px-3 py-2.5 backdrop-blur-md" style={{ flexShrink: 0 }}>
        {(displayFirstUrl || displaySecondUrl) && (
          <div className="mb-2 flex items-center justify-center gap-3">
            <span className="text-[10px] text-white/50">
              {selectedSide === 'first' ? '1枚目 選択中' : selectedSide === 'second' ? '2枚目 選択中' : (mode === 'photo' ? '画像をタップして選択' : '動画をタップして選択')}
            </span>
            <button
              onClick={() => handleZoom(-0.1)}
              disabled={!selectedSide}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white disabled:opacity-30"
            >
              -
            </button>
            <button
              onClick={() => handleZoom(0.1)}
              disabled={!selectedSide}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white disabled:opacity-30"
            >
              +
            </button>
            <button
              onClick={handleReset}
              className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-white/70"
            >
              リセット
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={isExporting || !canExport}
            className="flex-1 rounded-full bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
          >
            グリッドなし保存
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isExporting || !canExport}
            className="flex-1 rounded-full bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
          >
            グリッド付き保存
          </button>
        </div>
        <button
          onClick={handleSaveBoth}
          disabled={isExporting || !canExport}
          className="mt-1.5 w-full rounded-full border border-white/20 bg-white/10 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/20 active:scale-[0.97] disabled:opacity-50"
        >
          {isExporting
            ? mode === 'video' && exportProgress > 0
              ? `動画出力中... ${Math.round(exportProgress * 100)}%`
              : '出力中...'
            : '両方まとめて保存'}
        </button>
      </div>
    </div>
  );
}

function CellGrid({ color }: { color: 'white' | 'red' }) {
  const cols = 3;
  const rows = 10;
  const lineColor = color === 'red' ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.55)';
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {Array.from({ length: cols - 1 }, (_, i) => (
        <div
          key={`v${i}`}
          className="absolute top-0 bottom-0"
          style={{ left: `${((i + 1) / cols) * 100}%`, width: '0.5px', background: lineColor }}
        />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <div
          key={`h${i}`}
          className="absolute left-0 right-0"
          style={{ top: `${((i + 1) / rows) * 100}%`, height: '0.5px', background: lineColor }}
        />
      ))}
    </div>
  );
}

function TrimRow({
  label,
  accent,
  duration,
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  label: string;
  accent: string;
  duration: number;
  start: number;
  end: number;
  onStartChange: (v: number) => void;
  onEndChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px]" style={{ color: accent }}>
        <span className="font-semibold">{label}</span>
        <span className="text-white/60">
          {start.toFixed(1)}秒 〜 {end.toFixed(1)}秒（{(end - start).toFixed(1)}秒）
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-white/40 w-8">開始</span>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={start}
          onChange={(e) => onStartChange(parseFloat(e.target.value))}
          className="flex-1 accent-[#3DC4A8] h-1"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-white/40 w-8">終了</span>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={end}
          onChange={(e) => onEndChange(parseFloat(e.target.value))}
          className="flex-1 accent-[#5BB5E7] h-1"
        />
      </div>
    </div>
  );
}
