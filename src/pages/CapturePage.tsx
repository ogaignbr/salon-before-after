import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import GuideLines from '../components/GuideLines';
import GhostOverlay from '../components/GhostOverlay';
import { db } from '../lib/db';
import type { ShootingPart } from '../types';

export default function CapturePage() {
  const navigate = useNavigate();
  const { videoRef, isReady, error, start, stop, capture, switchCamera, facingMode } = useCamera();
  const [part, setPart] = useState<ShootingPart>('face');
  const [customerName, setCustomerName] = useState('');
  const [step, setStep] = useState<'setup' | 'before' | 'after'>('setup');
  const [beforeBlob, setBeforeBlob] = useState<Blob | null>(null);
  const [ghostOpacity, setGhostOpacity] = useState(0.35);
  const [showGuide, setShowGuide] = useState(true);
  const [flash, setFlash] = useState(false);

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

  const handleCaptureBefore = () => {
    const blob = capture();
    if (!blob) return;
    triggerFlash();
    setBeforeBlob(blob);
    setStep('after');
  };

  const handleCaptureAfter = async () => {
    const blob = capture();
    if (!blob || !beforeBlob) return;
    triggerFlash();
    stop();

    const id = await db.sessions.add({
      customerName: customerName || '名前未設定',
      part,
      beforeImage: beforeBlob,
      afterImage: blob,
      createdAt: new Date(),
    });

    navigate(`/preview/${id}`);
  };

  const handleRetakeBefore = () => {
    setBeforeBlob(null);
    setStep('before');
  };

  if (step === 'setup') {
    return (
      <div className="min-h-dvh bg-white flex flex-col">
        <div className="flex items-center px-4 py-3 border-b">
          <button onClick={() => navigate('/')} className="text-rose-500 font-bold text-sm">
            戻る
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-800">撮影設定</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 px-6 py-8 space-y-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">お客様名</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="例: 山田 花子 様"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">撮影部位</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPart('face')}
                className={`py-4 rounded-xl text-base font-bold transition ${
                  part === 'face'
                    ? 'bg-rose-500 text-white shadow'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                顔
              </button>
              <button
                onClick={() => setPart('body')}
                className={`py-4 rounded-xl text-base font-bold transition ${
                  part === 'body'
                    ? 'bg-rose-500 text-white shadow'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                体
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep('before')}
            className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg text-lg active:bg-rose-600 transition"
          >
            ビフォー撮影へ
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
      <div className="relative z-20 flex items-center justify-between px-4 py-2 bg-black/60 text-white">
        <button
          onClick={() => {
            stop();
            if (step === 'after') handleRetakeBefore();
            else { setStep('setup'); }
          }}
          className="text-sm"
        >
          戻る
        </button>
        <span className="font-bold text-sm">
          {step === 'before' ? 'ビフォー撮影' : 'アフター撮影'}
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

        {/* Ghost overlay for after shot */}
        {step === 'after' && beforeBlob && (
          <GhostOverlay imageBlob={beforeBlob} opacity={ghostOpacity} />
        )}

        {/* Guide lines */}
        {showGuide && <GuideLines part={part} />}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center p-4">
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-20 bg-black/80 px-4 py-4 space-y-3">
        {/* Ghost opacity slider (only in after mode) */}
        {step === 'after' && (
          <div className="flex items-center gap-3 px-2">
            <span className="text-white text-xs whitespace-nowrap">透過度</span>
            <input
              type="range"
              min="0"
              max="80"
              value={ghostOpacity * 100}
              onChange={(e) => setGhostOpacity(Number(e.target.value) / 100)}
              className="flex-1 accent-rose-500"
            />
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={`text-xs px-2 py-1 rounded ${showGuide ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'}`}
            >
              ガイド
            </button>
          </div>
        )}

        {step === 'before' && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={`text-xs px-3 py-1 rounded ${showGuide ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'}`}
            >
              ガイド {showGuide ? 'ON' : 'OFF'}
            </button>
          </div>
        )}

        {/* Shutter button */}
        <div className="flex items-center justify-center">
          <button
            onClick={step === 'before' ? handleCaptureBefore : handleCaptureAfter}
            disabled={!isReady}
            className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-30"
          >
            <div className="w-14 h-14 rounded-full bg-white active:bg-gray-300 transition" />
          </button>
        </div>
      </div>
    </div>
  );
}
