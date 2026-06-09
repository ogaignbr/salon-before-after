import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CenterGuide from '../components/CenterGuide';
import { useCamera } from '../hooks/useCamera';
import { useVideoRecorder } from '../hooks/useVideoRecorder';
import { shareOrDownloadImage, shareOrDownloadVideo } from '../lib/imageProcessor';

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function CaptureBeforePage() {
  const navigate = useNavigate();
  const { videoRef, stream, isReady, error, start, stop, capture, switchCamera, facingMode } = useCamera();
  const { isRecording, elapsedSeconds, recordedBlob, recordedUrl, startRecording, stopRecording, clearRecording } = useVideoRecorder(stream);

  const [flash, setFlash] = useState(false);
  const [captured, setCaptured] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  type GridMode = 'off' | 'white' | 'red';
  const [gridMode, setGridMode] = useState<GridMode>('white');
  const cycleGrid = () => setGridMode((v) => v === 'off' ? 'white' : v === 'white' ? 'red' : 'off');

  type CaptureMode = 'photo' | 'video';
  const [mode, setMode] = useState<CaptureMode>('photo');

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

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
    clearRecording();
    start();
  }, [start, previewUrl, clearRecording]);

  const handleSave = useCallback(async () => {
    if (!captured) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    await shareOrDownloadImage(captured, `pitacame_before_${stamp}.jpg`);
  }, [captured]);

  const handleSaveVideo = useCallback(async () => {
    if (!recordedBlob) return;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
    const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    await shareOrDownloadVideo(recordedBlob, `pitacame_before_video_${stamp}.${ext}`);
  }, [recordedBlob]);

  const handleToggleRecord = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleBack = () => {
    if (isRecording) stopRecording();
    stop();
    navigate('/home');
  };

  const hasPreview = mode === 'photo' ? !!(captured && previewUrl) : !!recordedUrl;
  const isLive = !hasPreview;

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
          {isLive && !isRecording && (
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
          {/* Photo preview */}
          {mode === 'photo' && captured && previewUrl ? (
            <>
              <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-contain" />
              <CenterGuide />
            </>
          ) : /* Video preview */ mode === 'video' && recordedUrl ? (
            <>
              <video src={recordedUrl} className="absolute inset-0 h-full w-full object-contain" controls playsInline />
              <CenterGuide />
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
              {gridMode !== 'off' && (
                <AlignedGrid color={gridMode} />
              )}
              <CenterGuide />
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">{formatTime(elapsedSeconds)}</span>
                </div>
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
        {hasPreview ? (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRetake}
              className="rounded-full bg-white/15 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/25 active:scale-[0.97]"
            >
              撮り直し
            </button>
            <button
              onClick={mode === 'photo' ? handleSave : handleSaveVideo}
              className="rounded-full bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.97]"
            >
              端末に保存
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={cycleGrid}
                disabled={isRecording}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  gridMode === 'off' ? 'bg-white/10 text-white/45' : gridMode === 'red' ? 'bg-red-500/70 text-white' : 'bg-[#3DC4A8]/70 text-white'
                } disabled:opacity-30`}
              >
                {gridMode === 'off' ? 'グリッド' : gridMode === 'white' ? 'グリッド(白)' : 'グリッド(赤)'}
              </button>
              <button
                onClick={() => setMode((m) => m === 'photo' ? 'video' : 'photo')}
                disabled={isRecording}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  mode === 'video' ? 'bg-red-500/70 text-white' : 'bg-white/10 text-white/60'
                } disabled:opacity-30`}
              >
                {mode === 'photo' ? '写真' : '動画'}
              </button>
            </div>

            {mode === 'photo' ? (
              <button
                onClick={handleCapture}
                disabled={!isReady}
                className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white/60 shadow-lg disabled:opacity-30"
              >
                <div className="h-12 w-12 rounded-full bg-white transition active:bg-slate-200" />
              </button>
            ) : (
              <button
                onClick={handleToggleRecord}
                disabled={!isReady}
                className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-red-400/80 shadow-lg disabled:opacity-30"
              >
                {isRecording ? (
                  <div className="h-8 w-8 rounded-sm bg-red-500 transition active:bg-red-600" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-red-500 transition active:bg-red-600" />
                )}
              </button>
            )}

            <div className="w-24" />
          </div>
        )}
      </div>
    </div>
  );
}

function AlignedGrid({ color }: { color: 'white' | 'red' }) {
  const cols = 4;
  const rows = 6;
  const lineColor = color === 'red' ? 'rgba(239,68,68,0.52)' : 'rgba(255,255,255,0.42)';
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
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
