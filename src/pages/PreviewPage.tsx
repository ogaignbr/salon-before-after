import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  blobToDataURL,
  createComparisonImage,
  shareOrDownloadImage,
  type ComparisonLayout,
} from '../lib/imageProcessor';
import MosaicCanvas from '../components/MosaicCanvas';
import { AppFrame, AppHeader } from '../components/AppFrame';

interface PreviewState {
  referenceImage?: Blob;
  capturedImage?: Blob;
}

export default function PreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PreviewState | null;
  const [referenceImage, setReferenceImage] = useState<Blob | null>(() => state?.referenceImage ?? null);
  const [capturedImage, setCapturedImage] = useState<Blob | null>(() => state?.capturedImage ?? null);
  const [referenceSrc, setReferenceSrc] = useState('');
  const [capturedSrc, setCapturedSrc] = useState('');
  const [editingMosaic, setEditingMosaic] = useState<'reference' | 'captured' | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!referenceImage) return;
    let active = true;
    blobToDataURL(referenceImage).then((url) => {
      if (active) setReferenceSrc(url);
    });
    return () => {
      active = false;
    };
  }, [referenceImage]);

  useEffect(() => {
    if (!capturedImage) return;
    let active = true;
    blobToDataURL(capturedImage).then((url) => {
      if (active) setCapturedSrc(url);
    });
    return () => {
      active = false;
    };
  }, [capturedImage]);

  if (!referenceImage || !capturedImage) {
    return (
      <AppFrame>
        <AppHeader title="出力" onBack={() => navigate('/capture')} backLabel="撮影" />
        <div className="flex flex-1 items-center justify-center px-4 text-center">
          <div>
            <p className="text-sm font-semibold text-[#1B3A5C] dark:text-slate-100">画像が見つかりません</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5B7689] dark:text-slate-400">
              アプリ内には画像を保存しないため、もう一度基準画像を選んで撮影してください。
            </p>
            <button
              onClick={() => navigate('/capture')}
              className="mt-5 rounded-[10px] bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] px-5 py-3 text-sm font-bold text-white"
            >
              撮影へ戻る
            </button>
          </div>
        </div>
      </AppFrame>
    );
  }

  if (editingMosaic) {
    const blob = editingMosaic === 'reference' ? referenceImage : capturedImage;
    return (
      <MosaicCanvas
        imageBlob={blob}
        onSave={(editedBlob) => {
          if (editingMosaic === 'reference') {
            setReferenceImage(editedBlob);
          } else {
            setCapturedImage(editedBlob);
          }
          setEditingMosaic(null);
        }}
        onCancel={() => setEditingMosaic(null)}
      />
    );
  }

  const handleSaveCaptured = async () => {
    setIsExporting(true);
    try {
      await shareOrDownloadImage(capturedImage, `pitacame_${dateStamp()}.jpg`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveComparison = async (layout: ComparisonLayout) => {
    setIsExporting(true);
    try {
      const blob = await createComparisonImage(referenceImage, capturedImage, layout);
      await shareOrDownloadImage(blob, `pitacame_compare_${layout}_${dateStamp()}.jpg`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppFrame>
      <AppHeader title="出力" onBack={() => navigate('/capture')} backLabel="撮影" />

      <div className="flex-1 space-y-4 overflow-y-auto px-1 pb-4 animate-slide-up">
        <div className="grid grid-cols-2 gap-2">
          <ImagePanel label="基準画像" src={referenceSrc} />
          <ImagePanel label="撮影画像" src={capturedSrc} accent />
        </div>

        <div className="rounded-[16px] border border-[#A8DDE5]/30 bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_12px_32px_rgba(60,140,170,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
          <p className="text-xs font-semibold tracking-[0.08em] text-[#1B3A5C] dark:text-slate-300">モザイク加工</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setEditingMosaic('reference')}
              className="flex-1 rounded-[10px] border border-[#3DC4A8]/60 bg-white py-2.5 text-sm font-semibold text-[#3DC4A8] shadow-[0_10px_28px_rgba(60,140,170,0.10)] transition-all hover:bg-[#F0FBF8] active:scale-[0.99] dark:border-cyan-300/20 dark:bg-slate-900/45 dark:text-slate-100"
            >
              基準画像
            </button>
            <button
              onClick={() => setEditingMosaic('captured')}
              className="flex-1 rounded-[10px] border border-[#3DC4A8]/60 bg-white py-2.5 text-sm font-semibold text-[#3DC4A8] shadow-[0_10px_28px_rgba(60,140,170,0.10)] transition-all hover:bg-[#F0FBF8] active:scale-[0.99] dark:border-cyan-300/20 dark:bg-slate-900/45 dark:text-slate-100"
            >
              撮影画像
            </button>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#A8DDE5]/30 bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_12px_32px_rgba(60,140,170,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
          <p className="text-xs font-semibold tracking-[0.08em] text-[#1B3A5C] dark:text-slate-300">保存・共有</p>
          <div className="mt-3 space-y-2">
            <button
              onClick={handleSaveCaptured}
              disabled={isExporting}
              className="sheen-wrap w-full rounded-[10px] border border-[#5BB5E7]/30 bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] py-3.5 font-bold text-white shadow-[0_8px_18px_rgba(70,160,200,0.24)] transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
            >
              撮影画像だけ保存
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSaveComparison('horizontal')}
                disabled={isExporting}
                className="rounded-[10px] border border-[#3DC4A8]/60 bg-white py-3 text-sm font-semibold text-[#3DC4A8] shadow-[0_10px_28px_rgba(60,140,170,0.10)] transition-all hover:bg-[#F0FBF8] active:scale-[0.99] disabled:opacity-50 dark:border-cyan-300/20 dark:bg-slate-900/45 dark:text-slate-100"
              >
                左右比較で保存
              </button>
              <button
                onClick={() => handleSaveComparison('vertical')}
                disabled={isExporting}
                className="rounded-[10px] border border-[#3DC4A8]/60 bg-white py-3 text-sm font-semibold text-[#3DC4A8] shadow-[0_10px_28px_rgba(60,140,170,0.10)] transition-all hover:bg-[#F0FBF8] active:scale-[0.99] disabled:opacity-50 dark:border-cyan-300/20 dark:bg-slate-900/45 dark:text-slate-100"
              >
                上下比較で保存
              </button>
            </div>
          </div>
          {isExporting && <p className="mt-3 text-center text-xs font-medium text-[#5B7689] dark:text-slate-400">出力中...</p>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/capture', { state: { referenceImage } })}
            className="rounded-[10px] border border-[#3DC4A8]/60 bg-white py-3 text-sm font-semibold text-[#1B3A5C] shadow-[0_10px_28px_rgba(60,140,170,0.10)] transition-all hover:bg-[#F0FBF8] active:scale-[0.99] dark:border-cyan-300/20 dark:bg-slate-900/45 dark:text-slate-100"
          >
            撮り直し
          </button>
          <button
            onClick={() => navigate('/capture')}
            className="rounded-[10px] border border-[#3DC4A8]/60 bg-white py-3 text-sm font-semibold text-[#1B3A5C] shadow-[0_10px_28px_rgba(60,140,170,0.10)] transition-all hover:bg-[#F0FBF8] active:scale-[0.99] dark:border-cyan-300/20 dark:bg-slate-900/45 dark:text-slate-100"
          >
            画像を選び直す
          </button>
        </div>
      </div>
    </AppFrame>
  );
}

function ImagePanel({ label, src, accent = false }: { label: string; src: string; accent?: boolean }) {
  return (
    <div className="rounded-[16px] border border-[#A8DDE5]/30 bg-[rgba(255,255,255,0.92)] p-2 shadow-[0_10px_28px_rgba(60,140,170,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
      <p className={`mb-2 text-center text-[11px] font-semibold ${accent ? 'text-[#3DC4A8]' : 'text-[#5B7689] dark:text-slate-400'}`}>
        {label}
      </p>
      {src && (
        <img
          src={src}
          alt={label}
          className="aspect-[3/4] w-full rounded-[10px] bg-slate-950/5 object-cover dark:bg-black/30"
        />
      )}
    </div>
  );
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replaceAll('-', '');
}
