import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import GuideLines from '../components/GuideLines';
import GhostOverlay from '../components/GhostOverlay';
import GridOverlay from '../components/GridOverlay';
import { db } from '../lib/db';
import type { ShootingPart } from '../types';

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

  // Resume from an existing session (after photo only)
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
      customerName: customerName || '名前未設定',
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
      <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex flex-col relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-4 text-pink-200 text-2xl animate-sparkle">&#10022;</div>
        <div className="absolute bottom-32 left-4 text-yellow-200 text-xl animate-sparkle" style={{ animationDelay: '1s' }}>&#9733;</div>

        {/* Header */}
        <div className="flex items-center px-4 py-3 bg-white/70 backdrop-blur-sm border-b border-pink-100">
          <button onClick={() => navigate('/')} className="text-pink-400 font-bold text-sm flex items-center gap-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            もどる
          </button>
          <h1 className="flex-1 text-center font-black text-pink-500 text-base">撮影設定</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 px-6 py-8 space-y-8 animate-slide-up">
          <div className="space-y-2">
            <label className="text-sm font-black text-pink-500 flex items-center gap-1">
              &#9829; お客様名
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="例: 山田 花子 様"
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 bg-white font-bold text-gray-700 placeholder-pink-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black text-pink-500 flex items-center gap-1">
              &#10022; 撮影部位
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPart('face')}
                className={`py-4 rounded-2xl text-base font-black transition-all ${
                  part === 'face'
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg scale-105'
                    : 'bg-white text-pink-300 border-2 border-pink-200'
                }`}
              >
                &#128102; 顔
              </button>
              <button
                onClick={() => setPart('body')}
                className={`py-4 rounded-2xl text-base font-black transition-all ${
                  part === 'body'
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg scale-105'
                    : 'bg-white text-pink-300 border-2 border-pink-200'
                }`}
              >
                &#128131; 体
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep('before')}
            className="w-full py-4 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-lg text-lg active:scale-95 transition-transform animate-pulse-glow"
          >
            ビフォー撮影へ &#10148;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-black flex flex-col relative overflow-hidden">
      {/* Flash effect */}
      {flash && <div className="absolute inset-0 bg-white z-50" />}

      {/* Header */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2 bg-gradient-to-r from-pink-500/80 to-rose-400/80 backdrop-blur-sm text-white">
        <button
          onClick={() => {
            stop();
            if (step === 'after') handleRetakeBefore();
            else { setStep('setup'); }
          }}
          className="text-sm font-bold flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          もどる
        </button>
        <span className="font-black text-sm">
          {step === 'before' ? '&#128248; ビフォー撮影' : '&#10024; アフター撮影'}
        </span>
        <button onClick={switchCamera} className="p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <p className="font-bold">{error}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-20 bg-gradient-to-t from-black/90 to-black/60 px-4 py-4 space-y-3">
        {step === 'after' && (
          <div className="flex items-center gap-3 px-2">
            <span className="text-white text-xs font-bold whitespace-nowrap">&#128123; 透過度</span>
            <input
              type="range"
              min="0"
              max="80"
              value={ghostOpacity * 100}
              onChange={(e) => setGhostOpacity(Number(e.target.value) / 100)}
              className="flex-1 accent-pink-400"
            />
          </div>
        )}

        {/* Toggle buttons */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`text-xs px-3 py-1.5 rounded-full font-bold transition ${showGuide ? 'bg-pink-400/50 text-white' : 'bg-white/10 text-white/50'}`}
          >
            ガイド {showGuide ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`text-xs px-3 py-1.5 rounded-full font-bold transition ${showGrid ? 'bg-red-400/50 text-white' : 'bg-white/10 text-white/50'}`}
          >
            グリッド {showGrid ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Shutter button */}
        <div className="flex items-center justify-center">
          <button
            onClick={step === 'before' ? handleCaptureBefore : handleCaptureAfter}
            disabled={!isReady}
            className="w-18 h-18 rounded-full border-4 border-pink-300 flex items-center justify-center disabled:opacity-30 shadow-lg shadow-pink-500/30"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 active:from-pink-400 active:to-rose-500 transition" />
          </button>
        </div>
      </div>
    </div>
  );
}
