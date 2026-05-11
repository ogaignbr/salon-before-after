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
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <p className="text-gray-400">読み込み中...</p>
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
    <div className="min-h-dvh bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b">
        <button onClick={() => navigate('/')} className="text-rose-500 font-bold text-sm">
          ホームへ
        </button>
        <h1 className="flex-1 text-center font-bold text-gray-800 text-sm">プレビュー</h1>
        <div className="w-14" />
      </div>

      {/* Customer info */}
      <div className="px-4 py-3 bg-gray-50 border-b">
        <p className="font-bold text-gray-800">{session.customerName}</p>
        <p className="text-xs text-gray-500">
          {new Date(session.createdAt).toLocaleDateString('ja-JP')} ・ {session.part === 'face' ? '顔' : '体'}
        </p>
      </div>

      {/* Compare view */}
      <div className="px-4 py-4">
        <CompareView beforeBlob={session.beforeImage} afterBlob={session.afterImage!} />
      </div>

      {/* Mosaic buttons */}
      <div className="px-4 space-y-2">
        <p className="text-xs font-bold text-gray-500">モザイク加工</p>
        <div className="flex gap-2">
          <button
            onClick={() => setEditingMosaic('before')}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold active:bg-gray-200"
          >
            ビフォーを編集
          </button>
          <button
            onClick={() => setEditingMosaic('after')}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold active:bg-gray-200"
          >
            アフターを編集
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-6 mt-auto space-y-2">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-3.5 bg-rose-500 text-white font-bold rounded-2xl shadow-lg active:bg-rose-600 transition disabled:opacity-50"
        >
          {isExporting ? '書き出し中...' : '比較画像を書き出し・共有'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleShareSingle(session.beforeImage, 'before')}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold active:bg-gray-200"
          >
            ビフォーのみ保存
          </button>
          <button
            onClick={() => handleShareSingle(session.afterImage!, 'after')}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold active:bg-gray-200"
          >
            アフターのみ保存
          </button>
        </div>
      </div>
    </div>
  );
}
