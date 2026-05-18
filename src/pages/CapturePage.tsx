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
  const [consent, setConsent] = useState(false);

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
      customerName: customerName || 'Unnamed',
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
      <div className="min-h-dvh bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center px-4 py-3 bg-white border-b border-slate-100">
          <button onClick={() => navigate('/home')} className="text-indigo-600 font-medium text-sm flex items-center gap-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="flex-1 text-center font-bold text-slate-800 text-sm">Capture Settings</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 px-6 py-8 space-y-6 animate-slide-up">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Client Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Hanako Yamada"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white font-medium text-slate-700 placeholder-slate-300 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Target Area
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPart('face')}
                className={`py-4 rounded-xl text-sm font-semibold transition-all ${
                  part === 'face'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300'
                }`}
              >
                Face
              </button>
              <button
                onClick={() => setPart('body')}
                className={`py-4 rounded-xl text-sm font-semibold transition-all ${
                  part === 'body'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300'
                }`}
              >
                Body
              </button>
            </div>
          </div>

          {/* Consent area */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Please obtain consent from the client for photo capture and data storage before proceeding.
              All data is stored locally on this device only and is never sent to external servers.
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-600 rounded flex-shrink-0"
              />
              <span className="text-[11px] text-slate-600 leading-snug">
                Client consent obtained.
                <button
                  type="button"
                  onClick={() => navigate('/privacy')}
                  className="text-indigo-500 ml-1 hover:text-indigo-700"
                >
                  Privacy
                </button>
                {' / '}
                <button
                  type="button"
                  onClick={() => navigate('/terms')}
                  className="text-indigo-500 hover:text-indigo-700"
                >
                  Terms
                </button>
              </span>
            </label>
          </div>

          <button
            onClick={() => setStep('before')}
            disabled={!consent}
            className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl shadow-md text-base hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100"
          >
            Proceed to Before Shot
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
      <div className="relative z-20 flex items-center justify-between px-4 py-2.5 bg-slate-900/80 backdrop-blur-md text-white border-b border-white/10">
        <button
          onClick={() => {
            stop();
            if (step === 'after') handleRetakeBefore();
            else { setStep('setup'); }
          }}
          className="text-sm font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span className="font-semibold text-sm tracking-wide">
          {step === 'before' ? 'BEFORE' : 'AFTER'}
        </span>
        <button onClick={switchCamera} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            <p className="font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-20 bg-gradient-to-t from-black/95 to-black/70 px-4 py-4 space-y-3">
        {step === 'after' && (
          <div className="flex items-center gap-3 px-2">
            <span className="text-white/70 text-xs font-medium whitespace-nowrap">Overlay</span>
            <input
              type="range"
              min="0"
              max="80"
              value={ghostOpacity * 100}
              onChange={(e) => setGhostOpacity(Number(e.target.value) / 100)}
              className="flex-1 accent-indigo-400"
            />
          </div>
        )}

        {/* Toggle buttons */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition ${showGuide ? 'bg-indigo-500/60 text-white' : 'bg-white/10 text-white/40'}`}
          >
            Guide {showGuide ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition ${showGrid ? 'bg-indigo-500/60 text-white' : 'bg-white/10 text-white/40'}`}
          >
            Grid {showGrid ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Shutter button */}
        <div className="flex items-center justify-center">
          <button
            onClick={step === 'before' ? handleCaptureBefore : handleCaptureAfter}
            disabled={!isReady}
            className="w-18 h-18 rounded-full border-[3px] border-white/60 flex items-center justify-center disabled:opacity-30 shadow-lg"
          >
            <div className="w-14 h-14 rounded-full bg-white active:bg-slate-200 transition" />
          </button>
        </div>
      </div>
    </div>
  );
}
