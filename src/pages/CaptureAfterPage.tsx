import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CenterGuide from '../components/CenterGuide';
import { useCamera } from '../hooks/useCamera';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import {
  createComparisonImage,
  createComparisonVideo,
  createOverlayComparisonImage,
  shareOrDownloadImage,
  shareOrDownloadVideo,
} from '../lib/imageProcessor';
import type { CapturePlan, CompareFrameSettings } from '../types';

type GridMode = 'off' | 'white' | 'red';
type Layer = 'before' | 'after';

const DEFAULT_PLAN: CapturePlan = {
  purpose: 'face',
  style: 'ghost',
  mediaType: 'photo',
  outputKind: 'both',
  title: '顔全体',
  beforeLabel: 'ビフォー画像',
  afterLabel: 'アフター写真',
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
}

export default function CaptureAfterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = ((location.state as { plan?: CapturePlan } | null)?.plan ?? DEFAULT_PLAN);
  const isVideo = plan.mediaType === 'video';
  const isGhost = plan.style === 'ghost' && !isVideo;

  const { videoRef, stream, isReady, error, start, stop, attachVideo, capture, switchCamera, facingMode } = useCamera();
  const { isRecording, elapsedSeconds, recordedBlob, recordedUrl, startRecording, stopRecording, clearRecording } = useVideoRecorder(stream);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<{ layer: Layer; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const pinchRef = useRef<{ layer: Layer; initialDist: number; initialScale: number } | null>(null);

  const [beforeBlob, setBeforeBlob] = useState<Blob | null>(null);
  const [beforeUrl, setBeforeUrl] = useState<string | null>(null);
  const [afterBlob, setAfterBlob] = useState<Blob | null>(null);
  const [afterUrl, setAfterUrl] = useState<string | null>(null);
  const [gridMode, setGridMode] = useState<GridMode>('white');
  const [ghostOpacity, setGhostOpacity] = useState(0.45);
  const [includeCenterLine, setIncludeCenterLine] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<Layer>('before');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState(false);
  const [beforePlaying, setBeforePlaying] = useState(false);

  const [beforeTransform, setBeforeTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [afterTransform, setAfterTransform] = useState({ scale: 1, x: 0, y: 0 });

  const hasBefore = !!beforeUrl;
  const hasAfter = isVideo ? !!recordedBlob && !!recordedUrl : !!afterBlob && !!afterUrl;
  const activeStep = !hasBefore ? 1 : !hasAfter ? 2 : 3;

  const settings: CompareFrameSettings = useMemo(() => ({
    ratio: '3:4',
    layout: plan.outputKind === 'vertical' ? 'vertical' : 'horizontal',
    borderEnabled: true,
    borderWidth: 2,
    borderColor: '#ffffff',
    dividerWidth: 2,
    borderRadius: 0,
  }), [plan.outputKind]);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  useEffect(() => {
    if (!hasBefore || hasAfter) return;
    if (stream) void attachVideo();
    else void start();
  }, [attachVideo, hasAfter, hasBefore, start, stream]);

  useEffect(() => {
    return () => {
      if (beforeUrl) URL.revokeObjectURL(beforeUrl);
      if (afterUrl) URL.revokeObjectURL(afterUrl);
    };
  }, [beforeUrl, afterUrl]);

  const cycleGrid = () => setGridMode((v) => v === 'off' ? 'white' : v === 'white' ? 'red' : 'off');

  const handlePickBefore = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (beforeUrl) URL.revokeObjectURL(beforeUrl);
    setBeforeBlob(file);
    setBeforeUrl(URL.createObjectURL(file));
    setBeforeTransform({ scale: 1, x: 0, y: 0 });
    setSelectedLayer('before');
    setMessage('');
    e.target.value = '';
  };

  const handleCapture = useCallback(() => {
    if (!beforeBlob) {
      setMessage('ビフォー画像を先に選択してください');
      return;
    }
    const blob = capture();
    if (!blob) {
      setMessage('カメラ映像を読み込んでいます。少し待ってから撮影してください');
      void attachVideo();
      return;
    }
    setFlash(true);
    window.setTimeout(() => setFlash(false), 150);
    if (afterUrl) URL.revokeObjectURL(afterUrl);
    setAfterBlob(blob);
    setAfterUrl(URL.createObjectURL(blob));
    setAfterTransform({ scale: 1, x: 0, y: 0 });
    setSelectedLayer('after');
    setMessage('');
    stop();
  }, [afterUrl, beforeBlob, capture, stop]);

  const handleToggleRecord = useCallback(() => {
    if (!beforeBlob) {
      setMessage('ビフォー動画を先に選択してください');
      return;
    }
    if (isRecording) stopRecording();
    else startRecording();
  }, [beforeBlob, isRecording, startRecording, stopRecording]);

  const handleRetake = useCallback(() => {
    if (afterUrl) URL.revokeObjectURL(afterUrl);
    setAfterBlob(null);
    setAfterUrl(null);
    setAfterTransform({ scale: 1, x: 0, y: 0 });
    setSelectedLayer('before');
    clearRecording();
    setMessage('');
    start();
  }, [afterUrl, clearRecording, start]);

  const buildOptions = (layout: 'horizontal' | 'vertical') => ({
    layout,
    ratio: settings.ratio,
    borderEnabled: settings.borderEnabled,
    borderWidth: settings.borderWidth,
    borderColor: settings.borderColor,
    dividerWidth: settings.dividerWidth,
    borderRadius: settings.borderRadius,
    firstScale: beforeTransform.scale,
    firstOffsetX: beforeTransform.x,
    firstOffsetY: beforeTransform.y,
    secondScale: afterTransform.scale,
    secondOffsetX: afterTransform.x,
    secondOffsetY: afterTransform.y,
    drawGrid: gridMode !== 'off',
    gridColor: gridMode === 'red' ? 'red' : 'white',
    includeCenterLine,
  });

  const savePhoto = async () => {
    if (!beforeBlob || !afterBlob) {
      setMessage('保存前にアフターを撮影してください');
      return;
    }
    const stamp = dateStamp();
    const saves: Promise<void>[] = [];
    const output = plan.outputKind;
    if (output === 'side-by-side' || output === 'vertical' || output === 'both') {
      const layout = output === 'vertical' ? 'vertical' : 'horizontal';
      saves.push(
        createComparisonImage(beforeBlob, afterBlob, buildOptions(layout)).then((blob) =>
          shareOrDownloadImage(blob, `pitacame_compare_${layout}_${stamp}.jpg`),
        ),
      );
    }
    if (output === 'overlay' || output === 'both') {
      saves.push(
        createOverlayComparisonImage(beforeBlob, afterBlob, {
          ratio: '3:4',
          beforeScale: beforeTransform.scale,
          beforeOffsetX: beforeTransform.x,
          beforeOffsetY: beforeTransform.y,
          afterScale: afterTransform.scale,
          afterOffsetX: afterTransform.x,
          afterOffsetY: afterTransform.y,
          ghostOpacity,
          includeCenterLine,
        }).then((blob) => shareOrDownloadImage(blob, `pitacame_overlay_${stamp}.jpg`)),
      );
    }
    for (const save of saves) {
      await save;
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    }
  };

  const saveVideo = async () => {
    if (!beforeBlob || !recordedBlob) {
      setMessage('保存前にアフター動画を撮影してください');
      return;
    }
    const blob = await createComparisonVideo(beforeBlob, recordedBlob, buildOptions('horizontal'));
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    await shareOrDownloadVideo(blob, `pitacame_compare_video_${dateStamp()}.${ext}`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      if (isVideo) await saveVideo();
      else await savePhoto();
    } catch (error) {
      const detail = error instanceof Error ? error.message : '不明なエラー';
      setMessage(`保存に失敗しました: ${detail}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBeforePlay = async () => {
    const v = beforeVideoRef.current;
    if (!v) return;
    if (v.paused) {
      try {
        await v.play();
        setBeforePlaying(true);
      } catch {
        setBeforePlaying(false);
      }
    } else {
      v.pause();
      setBeforePlaying(false);
    }
  };

  const handlePointerDown = (layer: Layer, e: React.PointerEvent) => {
    setSelectedLayer(layer);
    const t = layer === 'before' ? beforeTransform : afterTransform;
    dragRef.current = { layer, startX: e.clientX, startY: e.clientY, origX: t.x, origY: t.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const next = {
      x: dragRef.current.origX + e.clientX - dragRef.current.startX,
      y: dragRef.current.origY + e.clientY - dragRef.current.startY,
    };
    if (dragRef.current.layer === 'before') setBeforeTransform((t) => ({ ...t, ...next }));
    else setAfterTransform((t) => ({ ...t, ...next }));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleTouchStart = (layer: Layer, e: React.TouchEvent) => {
    setSelectedLayer(layer);
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const scale = layer === 'before' ? beforeTransform.scale : afterTransform.scale;
      pinchRef.current = { layer, initialDist: Math.hypot(dx, dy), initialScale: scale };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchRef.current) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const scale = Math.max(0.3, Math.min(5, pinchRef.current.initialScale * (Math.hypot(dx, dy) / pinchRef.current.initialDist)));
    if (pinchRef.current.layer === 'before') setBeforeTransform((t) => ({ ...t, scale }));
    else setAfterTransform((t) => ({ ...t, scale }));
  };

  const zoomSelected = (delta: number) => {
    const setter = selectedLayer === 'before' ? setBeforeTransform : setAfterTransform;
    setter((t) => ({ ...t, scale: Math.max(0.3, Math.min(5, t.scale + delta)) }));
  };

  const resetSelected = () => {
    if (selectedLayer === 'before') setBeforeTransform({ scale: 1, x: 0, y: 0 });
    else setAfterTransform({ scale: 1, x: 0, y: 0 });
  };

  const activeTransform = selectedLayer === 'before' ? beforeTransform : afterTransform;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-black text-white">
      {flash && <div className="absolute inset-0 z-50 bg-white" />}
      <input ref={fileInputRef} type="file" accept={isVideo ? 'video/*' : 'image/*'} className="hidden" onChange={handleFileChange} />

      <div className="relative z-20 border-b border-white/10 bg-slate-900/90 px-3 py-2 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              stop();
              navigate('/home');
            }}
            className="flex items-center gap-1 text-xs font-medium"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            ホーム
          </button>
          <span className="text-xs font-bold">{plan.title} / {isGhost ? 'ゴースト' : '左右比較'}</span>
          {!hasAfter && !isRecording ? (
            <button onClick={switchCamera} className="rounded-lg p-1.5 hover:bg-white/10">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          ) : <div className="w-8" />}
        </div>
        <StepBar activeStep={activeStep} />
      </div>

      {message && (
        <div className="absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full bg-red-500 px-4 py-2 text-xs font-bold shadow-lg">
          {message}
        </div>
      )}

      <div className="flex flex-1 items-center justify-center overflow-hidden px-1 py-1">
        {isGhost ? (
          <GhostStage
            beforeUrl={beforeUrl}
            afterUrl={afterUrl}
            videoRef={videoRef}
            facingMode={facingMode}
            beforeTransform={beforeTransform}
            afterTransform={afterTransform}
            ghostOpacity={ghostOpacity}
            gridMode={gridMode}
            error={error}
            activeStep={activeStep}
            onPickBefore={handlePickBefore}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => { pinchRef.current = null; }}
          />
        ) : (
          <CompareStage
            isVideo={isVideo}
            beforeUrl={beforeUrl}
            afterUrl={afterUrl}
            recordedUrl={recordedUrl}
            videoRef={videoRef}
            beforeVideoRef={beforeVideoRef}
            facingMode={facingMode}
            beforeTransform={beforeTransform}
            afterTransform={afterTransform}
            gridMode={gridMode}
            error={error}
            activeStep={activeStep}
            onPickBefore={handlePickBefore}
            onToggleBeforePlay={toggleBeforePlay}
            beforePlaying={beforePlaying}
            isRecording={isRecording}
            elapsedSeconds={elapsedSeconds}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => { pinchRef.current = null; }}
          />
        )}
      </div>

      <div className="relative z-20 border-t border-white/10 bg-slate-900/90 px-3 py-2.5 backdrop-blur-md">
        {hasAfter ? (
          <div className="space-y-2">
            {!isVideo && (
              <div className="flex items-center justify-center gap-2">
                <div className="flex rounded-full bg-white/10 p-0.5">
                  <button
                    onClick={() => setSelectedLayer('before')}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedLayer === 'before' ? 'bg-red-500 text-white' : 'text-white/50'}`}
                  >
                    ビフォー
                  </button>
                  <button
                    onClick={() => setSelectedLayer('after')}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${selectedLayer === 'after' ? 'bg-red-500 text-white' : 'text-white/50'}`}
                  >
                    アフター
                  </button>
                </div>
                <button onClick={() => zoomSelected(-0.1)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">-</button>
                <span className="w-9 text-center text-[10px] text-white/60">{Math.round(activeTransform.scale * 100)}%</span>
                <button onClick={() => zoomSelected(0.1)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">+</button>
                <button onClick={resetSelected} className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/70">リセット</button>
              </div>
            )}
            <label className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold">
              <input type="checkbox" checked={includeCenterLine} onChange={(e) => setIncludeCenterLine(e.target.checked)} className="accent-red-500" />
              保存にも中央線を入れる
            </label>
            <div className="flex gap-2">
              <button onClick={handleRetake} className="flex-1 rounded-full bg-white/15 py-3 text-sm font-bold text-white/80">
                撮り直し
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 animate-subtle-pulse rounded-full bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] py-3 text-sm font-black text-white shadow-lg disabled:opacity-50"
              >
                {isSaving ? '保存中...' : plan.outputKind === 'both' ? '両方保存' : '保存する'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {hasBefore && (
              <div className="flex items-center justify-center gap-2">
                <div className="flex rounded-full bg-white/10 p-0.5">
                  <button
                    onClick={() => setSelectedLayer('before')}
                    className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold text-white"
                  >
                    ビフォー
                  </button>
                </div>
                <button onClick={() => zoomSelected(-0.1)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">-</button>
                <span className="w-9 text-center text-[10px] text-white/60">{Math.round(beforeTransform.scale * 100)}%</span>
                <button onClick={() => zoomSelected(0.1)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">+</button>
                <button onClick={resetSelected} className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/70">リセット</button>
              </div>
            )}
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={cycleGrid}
                disabled={isRecording}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  gridMode === 'off' ? 'bg-white/10 text-white/45' : gridMode === 'red' ? 'bg-red-500/70 text-white' : 'bg-[#3DC4A8]/70 text-white'
                } disabled:opacity-30`}
              >
                {gridMode === 'off' ? 'グリッド' : gridMode === 'white' ? '白グリッド' : '赤グリッド'}
              </button>
              {isGhost && hasBefore && (
                <label className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1.5 text-[10px] font-bold">
                  濃度
                  <input type="range" min={0.15} max={0.8} step={0.05} value={ghostOpacity} onChange={(e) => setGhostOpacity(Number(e.target.value))} className="w-16 accent-red-500" />
                </label>
              )}
            </div>

            {isVideo ? (
              <button
                onClick={handleToggleRecord}
                disabled={!isReady}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] shadow-lg disabled:opacity-30 ${
                  activeStep === 2 ? 'animate-subtle-pulse border-red-400 ring-4 ring-red-500/35' : 'border-red-400/80'
                }`}
              >
                {isRecording ? <div className="h-8 w-8 rounded-sm bg-red-500" /> : <div className="h-12 w-12 rounded-full bg-red-500" />}
              </button>
            ) : (
              <button
                onClick={handleCapture}
                disabled={!isReady || !hasBefore}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] shadow-lg disabled:opacity-30 ${
                  activeStep === 2 ? 'animate-subtle-pulse border-red-400 ring-4 ring-red-500/35' : 'border-white/60'
                }`}
              >
                <div className="h-12 w-12 rounded-full bg-white" />
              </button>
            )}

            <div className="w-24" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepBar({ activeStep }: { activeStep: number }) {
  const labels = ['ビフォー', '撮影', '保存'];
  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {labels.map((label, index) => {
        const step = index + 1;
        const active = step === activeStep;
        const done = step < activeStep;
        return (
          <div key={label} className={`rounded-full px-2 py-1 text-center text-[10px] font-black ${active ? 'bg-red-500 text-white' : done ? 'bg-[#3DC4A8] text-white' : 'bg-white/10 text-white/40'}`}>
            {step}. {label}
          </div>
        );
      })}
    </div>
  );
}

function GridLayer({ gridMode }: { gridMode: GridMode }) {
  if (gridMode === 'off') return null;
  const cols = 4;
  const rows = 6;
  const lineColor = gridMode === 'red' ? 'rgba(239,68,68,0.52)' : 'rgba(255,255,255,0.42)';
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {Array.from({ length: cols - 1 }, (_, i) => (
        <div
          key={`v${i}`}
          className="absolute top-0 bottom-0"
          style={{ left: `${((i + 1) / cols) * 100}%`, width: '1px', background: lineColor }}
        />
      ))}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <div
          key={`h${i}`}
          className="absolute left-0 right-0"
          style={{ top: `${((i + 1) / rows) * 100}%`, height: '1px', background: lineColor }}
        />
      ))}
    </div>
  );
}

function EmptyBeforeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-full w-full flex-col items-center justify-center gap-2 text-white/70 ${active ? 'animate-subtle-pulse ring-4 ring-inset ring-red-500' : ''}`}
    >
      <svg className="h-9 w-9 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
      </svg>
      <span className="text-xs font-black">{label}</span>
    </button>
  );
}

function transformStyle(t: { scale: number; x: number; y: number }) {
  return {
    transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
    transformOrigin: 'center',
  };
}

function GhostStage({
  beforeUrl,
  afterUrl,
  videoRef,
  facingMode,
  beforeTransform,
  afterTransform,
  ghostOpacity,
  gridMode,
  error,
  activeStep,
  onPickBefore,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: {
  beforeUrl: string | null;
  afterUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  facingMode: 'user' | 'environment';
  beforeTransform: { scale: number; x: number; y: number };
  afterTransform: { scale: number; x: number; y: number };
  ghostOpacity: number;
  gridMode: GridMode;
  error: string | null;
  activeStep: number;
  onPickBefore: () => void;
  onPointerDown: (layer: Layer, e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onTouchStart: (layer: Layer, e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}) {
  return (
    <div className="relative h-full max-h-full w-full max-w-[430px] overflow-hidden rounded-lg border border-white/10 bg-black" style={{ aspectRatio: '3 / 4' }}>
      {!beforeUrl ? (
        <EmptyBeforeButton label="ビフォーを選択" active={activeStep === 1} onClick={onPickBefore} />
      ) : (
        <>
          {afterUrl ? (
            <img
              src={afterUrl}
              alt="アフター"
              className="absolute inset-0 h-full w-full object-contain"
              style={transformStyle(afterTransform)}
              onPointerDown={(e) => onPointerDown('after', e)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onTouchStart={(e) => onTouchStart('after', e)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />
          ) : (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-contain"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined, background: '#000' }}
              autoPlay
              playsInline
              muted
            />
          )}
          <img
            src={beforeUrl}
            alt="ビフォー"
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
            style={{ ...transformStyle(beforeTransform), opacity: ghostOpacity }}
            onPointerDown={(e) => onPointerDown('before', e)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTouchStart={(e) => onTouchStart('before', e)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
          <GridLayer gridMode={gridMode} />
          <CenterGuide />
        </>
      )}
      {error && <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4 text-center text-xs font-bold">{error}</div>}
    </div>
  );
}

function CompareStage({
  isVideo,
  beforeUrl,
  afterUrl,
  recordedUrl,
  videoRef,
  beforeVideoRef,
  facingMode,
  beforeTransform,
  afterTransform,
  gridMode,
  error,
  activeStep,
  onPickBefore,
  onToggleBeforePlay,
  beforePlaying,
  isRecording,
  elapsedSeconds,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: {
  isVideo: boolean;
  beforeUrl: string | null;
  afterUrl: string | null;
  recordedUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  beforeVideoRef: React.RefObject<HTMLVideoElement | null>;
  facingMode: 'user' | 'environment';
  beforeTransform: { scale: number; x: number; y: number };
  afterTransform: { scale: number; x: number; y: number };
  gridMode: GridMode;
  error: string | null;
  activeStep: number;
  onPickBefore: () => void;
  onToggleBeforePlay: () => void;
  beforePlaying: boolean;
  isRecording: boolean;
  elapsedSeconds: number;
  onPointerDown: (layer: Layer, e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onTouchStart: (layer: Layer, e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}) {
  return (
    <div className="flex h-full max-h-full w-full max-w-[430px] overflow-hidden rounded-lg border border-white/10 bg-black" style={{ aspectRatio: '3 / 4' }}>
      <div className="relative flex-1 overflow-hidden border-r border-white/20 bg-slate-900">
        {!beforeUrl ? (
          <EmptyBeforeButton label={isVideo ? 'ビフォー動画' : 'ビフォー画像'} active={activeStep === 1} onClick={onPickBefore} />
        ) : isVideo ? (
          <>
            <video ref={beforeVideoRef} src={beforeUrl} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-contain" style={transformStyle(beforeTransform)} />
            <button onClick={onToggleBeforePlay} className="absolute left-1 top-1 z-40 rounded-full bg-black/60 px-2 py-1 text-[10px] font-black">
              {beforePlaying ? '停止' : '再生'}
            </button>
          </>
        ) : (
          <img
            src={beforeUrl}
            alt="ビフォー"
            className="absolute inset-0 h-full w-full object-contain"
            style={transformStyle(beforeTransform)}
            onPointerDown={(e) => onPointerDown('before', e)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTouchStart={(e) => onTouchStart('before', e)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        )}
        {beforeUrl && <GridLayer gridMode={gridMode} />}
        {beforeUrl && <CenterGuide />}
      </div>

      <div className="relative flex-1 overflow-hidden bg-black">
        {isVideo && recordedUrl ? (
          <video src={recordedUrl} className="absolute inset-0 h-full w-full object-contain" controls playsInline />
        ) : !isVideo && afterUrl ? (
          <img
            src={afterUrl}
            alt="アフター"
            className="absolute inset-0 h-full w-full object-contain"
            style={transformStyle(afterTransform)}
            onPointerDown={(e) => onPointerDown('after', e)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTouchStart={(e) => onTouchStart('after', e)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              className={`absolute inset-0 h-full w-full object-contain ${activeStep === 2 ? 'ring-4 ring-inset ring-red-500' : ''}`}
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined, background: '#000' }}
              autoPlay
              playsInline
              muted
            />
            {isRecording && (
              <div className="absolute left-1/2 top-3 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/65 px-3 py-1.5">
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs font-black">{formatTime(elapsedSeconds)}</span>
              </div>
            )}
          </>
        )}
        <GridLayer gridMode={gridMode} />
        <CenterGuide />
        {error && <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4 text-center text-xs font-bold">{error}</div>}
      </div>
    </div>
  );
}
