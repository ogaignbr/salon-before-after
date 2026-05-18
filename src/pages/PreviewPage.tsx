import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { createComparisonImage, blobToDataURL } from '../lib/imageProcessor';
import CompareView from '../components/CompareView';
import MosaicCanvas from '../components/MosaicCanvas';
import type { Session } from '../types';

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [editingMosaic, setEditingMosaic] = useState<'before' | 'after' | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (id) {
      db.sessions.get(Number(id)).then((s) => {
        if (s) setSession(s);
      });
    }
  }, [id]);

  if (!session || !session.afterImage) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (editingMosaic) {
    const blob = editingMosaic === 'before' ? session.beforeImage : session.afterImage!;
    return (
      <MosaicCanvas
        imageBlob={blob}
        onSave={async (editedBlob) => {
          const update = editingMosaic === 'before'
            ? { beforeImage: editedBlob }
            : { afterImage: editedBlob };
          await db.sessions.update(session.id!, update);
          setSession({ ...session, ...update });
          setEditingMosaic(null);
        }}
        onCancel={() => setEditingMosaic(null)}
      />
    );
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const compBlob = await createComparisonImage(session.beforeImage, session.afterImage!);
      const url = await blobToDataURL(compBlob);

      if (navigator.share) {
        const file = new File([compBlob], 'before-after.jpg', { type: 'image/jpeg' });
        await navigator.share({ files: [file] });
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `before-after_${session.customerName}_${new Date().toISOString().slice(0, 10)}.jpg`;
        a.click();
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        const compBlob = await createComparisonImage(session.beforeImage, session.afterImage!);
        const url = await blobToDataURL(compBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `before-after_${session.customerName}_${new Date().toISOString().slice(0, 10)}.jpg`;
        a.click();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareSingle = async (blob: Blob, label: string) => {
    if (navigator.share) {
      try {
        const file = new File([blob], `${label}.jpg`, { type: 'image/jpeg' });
        await navigator.share({ files: [file] });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }
    const url = await blobToDataURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label}_${session.customerName}.jpg`;
    a.click();
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-white border-b border-slate-100">
        <button onClick={() => navigate('/home')} className="text-indigo-600 font-medium text-sm flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </button>
        <h1 className="flex-1 text-center font-bold text-slate-800 text-sm">Preview</h1>
        <div className="w-14" />
      </div>

      {/* Customer info */}
      <div className="px-5 py-3 bg-white border-b border-slate-100">
        <p className="font-semibold text-slate-800">{session.customerName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-slate-400 font-medium">
            {new Date(session.createdAt).toLocaleDateString('ja-JP')}
          </p>
          <span className="text-xs text-slate-300">|</span>
          <p className="text-xs text-slate-400 font-medium">
            {session.part === 'face' ? 'Face' : 'Body'}
          </p>
        </div>
      </div>

      {/* Compare view */}
      <div className="px-4 py-4 animate-slide-up">
        <CompareView beforeBlob={session.beforeImage} afterBlob={session.afterImage!} />
      </div>

      {/* Mosaic buttons */}
      <div className="px-4 space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mosaic Editor</p>
        <div className="flex gap-2">
          <button
            onClick={() => setEditingMosaic('before')}
            className="flex-1 py-2.5 rounded-xl bg-white text-slate-600 text-sm font-semibold border border-slate-200 hover:border-indigo-300 active:scale-[0.98] transition-all"
          >
            Edit Before
          </button>
          <button
            onClick={() => setEditingMosaic('after')}
            className="flex-1 py-2.5 rounded-xl bg-white text-slate-600 text-sm font-semibold border border-slate-200 hover:border-indigo-300 active:scale-[0.98] transition-all"
          >
            Edit After
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-6 mt-auto space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 animate-subtle-pulse"
        >
          {isExporting ? 'Exporting...' : 'Export & Share Comparison'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleShareSingle(session.beforeImage, 'before')}
            className="flex-1 py-2.5 rounded-xl bg-white text-slate-600 text-sm font-semibold border border-slate-200 hover:border-indigo-300 active:scale-[0.98] transition-all"
          >
            Before Only
          </button>
          <button
            onClick={() => handleShareSingle(session.afterImage!, 'after')}
            className="flex-1 py-2.5 rounded-xl bg-white text-slate-600 text-sm font-semibold border border-slate-200 hover:border-indigo-300 active:scale-[0.98] transition-all"
          >
            After Only
          </button>
        </div>
      </div>
    </div>
  );
}
