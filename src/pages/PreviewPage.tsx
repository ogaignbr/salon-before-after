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
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-pink-100 to-white">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-float">&#128248;</div>
          <p className="text-pink-300 font-bold">読み込み中...</p>
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
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex flex-col relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-20 right-3 text-pink-200 text-xl animate-sparkle">&#10022;</div>
      <div className="absolute bottom-40 left-3 text-yellow-200 text-lg animate-sparkle" style={{ animationDelay: '1s' }}>&#9733;</div>

      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-white/70 backdrop-blur-sm border-b border-pink-100">
        <button onClick={() => navigate('/')} className="text-pink-400 font-bold text-sm flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          ホーム
        </button>
        <h1 className="flex-1 text-center font-black text-pink-500 text-base">&#10024; プレビュー</h1>
        <div className="w-14" />
      </div>

      {/* Customer info */}
      <div className="px-4 py-3 bg-white/50 border-b border-pink-100">
        <p className="font-black text-pink-600">{session.customerName}</p>
        <p className="text-xs text-pink-400 font-bold">
          {new Date(session.createdAt).toLocaleDateString('ja-JP')} ・ {session.part === 'face' ? '&#128102; 顔' : '&#128131; 体'}
        </p>
      </div>

      {/* Compare view */}
      <div className="px-4 py-4 animate-slide-up">
        <CompareView beforeBlob={session.beforeImage} afterBlob={session.afterImage!} />
      </div>

      {/* Mosaic buttons */}
      <div className="px-4 space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <p className="text-xs font-black text-pink-400">&#128064; モザイク加工</p>
        <div className="flex gap-2">
          <button
            onClick={() => setEditingMosaic('before')}
            className="flex-1 py-2.5 rounded-2xl bg-white text-pink-500 text-sm font-black border-2 border-pink-200 active:scale-95 transition-transform"
          >
            ビフォーを編集
          </button>
          <button
            onClick={() => setEditingMosaic('after')}
            className="flex-1 py-2.5 rounded-2xl bg-white text-pink-500 text-sm font-black border-2 border-pink-200 active:scale-95 transition-transform"
          >
            アフターを編集
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-6 mt-auto space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50 animate-pulse-glow"
        >
          {isExporting ? '書き出し中...' : '&#128247; 比較画像を書き出し・共有'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleShareSingle(session.beforeImage, 'before')}
            className="flex-1 py-2.5 rounded-2xl bg-white text-pink-500 text-sm font-black border-2 border-pink-200 active:scale-95 transition-transform"
          >
            ビフォーのみ
          </button>
          <button
            onClick={() => handleShareSingle(session.afterImage!, 'after')}
            className="flex-1 py-2.5 rounded-2xl bg-white text-pink-500 text-sm font-black border-2 border-pink-200 active:scale-95 transition-transform"
          >
            アフターのみ
          </button>
        </div>
      </div>
    </div>
  );
}
