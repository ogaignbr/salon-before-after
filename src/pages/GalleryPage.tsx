import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

export default function GalleryPage() {
  const navigate = useNavigate();
  const { images, baseImageId, setBaseImageId, removeImage } = useSession();
  const [firstId, setFirstId] = useState<string | null>(null);
  const [secondId, setSecondId] = useState<string | null>(null);

  // Sync base image with first selection
  useEffect(() => {
    if (firstId && firstId !== baseImageId) {
      setBaseImageId(firstId);
    }
  }, [firstId, baseImageId, setBaseImageId]);

  // Initialize firstId from baseImageId
  useEffect(() => {
    if (baseImageId && !firstId) {
      setFirstId(baseImageId);
    }
  }, [baseImageId, firstId]);

  const thumbUrls = useMemo(() => {
    const map = new Map<string, string>();
    images.forEach((img) => {
      map.set(img.id, URL.createObjectURL(img.blob));
    });
    return map;
  }, [images]);

  useEffect(() => {
    return () => {
      thumbUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [thumbUrls]);

  const handleSelect = (id: string) => {
    if (firstId === id) {
      setFirstId(null);
      return;
    }
    if (secondId === id) {
      setSecondId(null);
      return;
    }
    if (!firstId) {
      setFirstId(id);
    } else if (!secondId) {
      setSecondId(id);
    } else {
      // Replace second
      setSecondId(id);
    }
  };

  const handleDelete = (id: string) => {
    if (firstId === id) setFirstId(null);
    if (secondId === id) setSecondId(null);
    removeImage(id);
  };

  const canCompare = firstId !== null && secondId !== null;

  const handleCompare = () => {
    if (!canCompare) return;
    navigate('/compare', { state: { firstId, secondId } });
  };

  if (images.length === 0) {
    return (
      <div className="flex h-dvh flex-col bg-black text-white">
        <div className="flex items-center border-b border-white/10 bg-slate-900/80 px-4 py-3 backdrop-blur-md">
          <button onClick={() => navigate('/capture')} className="flex items-center gap-1 text-sm font-medium">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            撮影
          </button>
          <span className="flex-1 text-center text-sm font-semibold">撮影済み画像</span>
          <div className="w-10" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-white/50">まだ撮影した画像がありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center border-b border-white/10 bg-slate-900/80 px-4 py-3 backdrop-blur-md" style={{ flexShrink: 0 }}>
        <button onClick={() => navigate('/capture')} className="flex items-center gap-1 text-sm font-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          撮影
        </button>
        <span className="flex-1 text-center text-sm font-semibold">撮影済み画像 ({images.length}枚)</span>
        <div className="w-10" />
      </div>

      {/* Instructions */}
      <div className="bg-slate-900/60 px-4 py-2 text-center text-xs text-white/60" style={{ flexShrink: 0 }}>
        比較する2枚を選択してください（1枚目=基準、2枚目=比較対象）
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="grid grid-cols-3 gap-2">
          {images.map((img) => {
            const url = thumbUrls.get(img.id);
            const isFirst = firstId === img.id;
            const isSecond = secondId === img.id;
            const selected = isFirst || isSecond;
            return (
              <div key={img.id} className="relative">
                <button
                  onClick={() => handleSelect(img.id)}
                  className={`block w-full overflow-hidden rounded-lg border-2 transition ${
                    isFirst
                      ? 'border-[#3DC4A8] shadow-[0_0_8px_rgba(61,196,168,0.5)]'
                      : isSecond
                        ? 'border-[#5BB5E7] shadow-[0_0_8px_rgba(91,181,231,0.5)]'
                        : 'border-transparent'
                  }`}
                >
                  {url && (
                    <img src={url} alt="" className="aspect-[3/4] w-full object-cover" />
                  )}
                  {selected && (
                    <div className={`absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      isFirst ? 'bg-[#3DC4A8]' : 'bg-[#5BB5E7]'
                    }`}>
                      {isFirst ? '1' : '2'}
                    </div>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white/70 transition hover:bg-red-500/80 hover:text-white"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-slate-900/80 px-4 py-3 backdrop-blur-md" style={{ flexShrink: 0 }}>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/capture')}
            className="flex-1 rounded-full bg-white/15 py-3 text-sm font-medium text-white/80 transition hover:bg-white/25 active:scale-[0.97]"
          >
            撮影に戻る
          </button>
          <button
            onClick={handleCompare}
            disabled={!canCompare}
            className="flex-1 rounded-full bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.97] disabled:opacity-40"
          >
            比較する
          </button>
        </div>
      </div>
    </div>
  );
}
