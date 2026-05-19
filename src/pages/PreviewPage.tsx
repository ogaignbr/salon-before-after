import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { createComparisonImage, blobToDataURL } from '../lib/imageProcessor';
import CompareView from '../components/CompareView';
import MosaicCanvas from '../components/MosaicCanvas';
import type { Session } from '../types';
import { AppFrame, AppHeader } from '../components/AppFrame';

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
      <AppFrame>
        <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-[#B9A7FF] border-t-[#6B4CFF] dark:border-indigo-300/20 dark:border-t-indigo-300" />
          <p className="text-sm font-medium text-[#6B6F8A] dark:text-slate-500">読み込み中...</p>
        </div>
        </div>
      </AppFrame>
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
    <AppFrame>
      <AppHeader title="プレビュー" onBack={() => navigate('/home')} backLabel="ホーム" />

      {/* Customer info */}
      <div className="mb-3 rounded-[16px] border border-[#B9A7FF]/30 bg-[rgba(255,255,255,0.92)] px-4 py-3 shadow-[0_12px_32px_rgba(85,70,180,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_16px_34px_-26px_rgba(45,74,152,0.85)]">
        <p className="font-semibold text-[#161B5C] dark:text-slate-100">{session.customerName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs font-medium text-[#6B6F8A] dark:text-slate-500">
            {new Date(session.createdAt).toLocaleDateString('ja-JP')}
          </p>
          <span className="text-xs text-[#DCD7FF] dark:text-slate-600">|</span>
          <p className="text-xs font-medium text-[#6B6F8A] dark:text-slate-500">
            {session.part === 'face' ? '顔' : '体'}
          </p>
        </div>
      </div>

      {/* Compare view */}
      <div className="animate-slide-up px-1 pb-4">
        <CompareView beforeBlob={session.beforeImage} afterBlob={session.afterImage!} />
      </div>

      {/* Mosaic buttons */}
      <div className="animate-slide-up space-y-2 px-1" style={{ animationDelay: '0.1s' }}>
        <p className="text-xs font-semibold tracking-[0.08em] text-[#161B5C] dark:text-slate-300">モザイク編集</p>
        <div className="flex gap-2">
          <button
            onClick={() => setEditingMosaic('before')}
            className="flex-1 rounded-[10px] border border-[#6B4CFF]/60 bg-white py-2.5 text-sm font-semibold text-[#6B4CFF] shadow-[0_10px_28px_rgba(85,70,180,0.10)] backdrop-blur-xl transition-all hover:bg-[#F4F2FF] active:scale-[0.99] dark:border-indigo-300/20 dark:bg-slate-900/45 dark:text-slate-100 dark:shadow-[0_16px_34px_-26px_rgba(45,74,152,0.85)]"
          >
            Beforeを編集
          </button>
          <button
            onClick={() => setEditingMosaic('after')}
            className="flex-1 rounded-[10px] border border-[#6B4CFF]/60 bg-white py-2.5 text-sm font-semibold text-[#6B4CFF] shadow-[0_10px_28px_rgba(85,70,180,0.10)] backdrop-blur-xl transition-all hover:bg-[#F4F2FF] active:scale-[0.99] dark:border-indigo-300/20 dark:bg-slate-900/45 dark:text-slate-100 dark:shadow-[0_16px_34px_-26px_rgba(45,74,152,0.85)]"
          >
            Afterを編集
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-auto space-y-2 px-1 pb-1 pt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="sheen-wrap animate-subtle-pulse w-full rounded-[10px] border border-[#8B5CFF]/30 bg-[linear-gradient(135deg,#6B4CFF_0%,#7B54FF_48%,#8B5CFF_100%)] py-3.5 font-bold text-white shadow-[0_8px_18px_rgba(90,65,230,0.24)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
        >
          {isExporting ? '書き出し中...' : '比較画像を書き出し・共有'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleShareSingle(session.beforeImage, 'before')}
            className="flex-1 rounded-[10px] border border-[#6B4CFF]/60 bg-white py-2.5 text-sm font-semibold text-[#6B4CFF] shadow-[0_10px_28px_rgba(85,70,180,0.10)] backdrop-blur-xl transition-all hover:bg-[#F4F2FF] active:scale-[0.99] dark:border-indigo-300/20 dark:bg-slate-900/45 dark:text-slate-100 dark:shadow-[0_16px_34px_-26px_rgba(45,74,152,0.85)]"
          >
            Beforeのみ
          </button>
          <button
            onClick={() => handleShareSingle(session.afterImage!, 'after')}
            className="flex-1 rounded-[10px] border border-[#6B4CFF]/60 bg-white py-2.5 text-sm font-semibold text-[#6B4CFF] shadow-[0_10px_28px_rgba(85,70,180,0.10)] backdrop-blur-xl transition-all hover:bg-[#F4F2FF] active:scale-[0.99] dark:border-indigo-300/20 dark:bg-slate-900/45 dark:text-slate-100 dark:shadow-[0_16px_34px_-26px_rgba(45,74,152,0.85)]"
          >
            Afterのみ
          </button>
        </div>
      </div>
    </AppFrame>
  );
}
