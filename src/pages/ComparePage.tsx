import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { createComparisonImage, shareOrDownloadImage, blobToDataURL } from '../lib/imageProcessor';
import MosaicCanvas from '../components/MosaicCanvas';
import type { CompareFrameRatio, CompareFrameSettings } from '../types';

interface LocationState {
  firstId?: string;
  secondId?: string;
  firstBlob?: Blob;
  secondBlob?: Blob;
}

const RATIO_OPTIONS: { value: CompareFrameRatio; label: string }[] = [
  { value: '3:4', label: '3:4 縦長' },
  { value: '9:16', label: '9:16 縦長' },
  { value: '4:3', label: '4:3 横長' },
];

const RATIO_CSS: Record<CompareFrameRatio, string> = {
  '3:4': '3 / 4',
  '9:16': '9 / 16',
  '4:3': '4 / 3',
};

const PRESET_COLORS = ['#ffffff', '#000000', '#3DC4A8', '#5BB5E7', '#E5486D', '#F59E0B'];

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replaceAll('-', '');
}

export default function ComparePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { images } = useSession();

  const [settings, setSettings] = useState<CompareFrameSettings>({
    ratio: '3:4',
    layout: 'horizontal',
    borderEnabled: true,
    borderWidth: 2,
    borderColor: '#ffffff',
    dividerWidth: 2,
    borderRadius: 0,
  });

  const [selectedSide, setSelectedSide] = useState<'first' | 'second' | null>(null);
  const [firstScale, setFirstScale] = useState(1);
  const [firstOffset, setFirstOffset] = useState({ x: 0, y: 0 });
  const [secondScale, setSecondScale] = useState(1);
  const [secondOffset, setSecondOffset] = useState({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [editingMosaic, setEditingMosaic] = useState<'first' | 'second' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Override blobs for mosaic-edited images
  const [firstBlobOverride, setFirstBlobOverride] = useState<Blob | null>(null);
  const [secondBlobOverride, setSecondBlobOverride] = useState<Blob | null>(null);

  // Resolve blobs: from direct blob or session id
  const firstImageFromSession = useMemo(() => images.find((i) => i.id === state?.firstId), [images, state?.firstId]);
  const secondImageFromSession = useMemo(() => images.find((i) => i.id === state?.secondId), [images, state?.secondId]);

  const firstBlob = firstBlobOverride ?? state?.firstBlob ?? firstImageFromSession?.blob ?? null;
  const secondBlob = secondBlobOverride ?? state?.secondBlob ?? secondImageFromSession?.blob ?? null;

  const [firstSrc, setFirstSrc] = useState('');
  const [secondSrc, setSecondSrc] = useState('');

  useEffect(() => {
    if (!firstBlob) return;
    let active = true;
    blobToDataURL(firstBlob).then((url) => { if (active) setFirstSrc(url); });
    return () => { active = false; };
  }, [firstBlob]);

  useEffect(() => {
    if (!secondBlob) return;
    let active = true;
    blobToDataURL(secondBlob).then((url) => { if (active) setSecondSrc(url); });
    return () => { active = false; };
  }, [secondBlob]);

  // Drag state
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handlePointerDown = useCallback((side: 'first' | 'second', e: React.PointerEvent) => {
    setSelectedSide(side);
    const offset = side === 'first' ? firstOffset : secondOffset;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [firstOffset, secondOffset]);

  const handlePointerMove = useCallback((side: 'first' | 'second', e: React.PointerEvent) => {
    if (!dragRef.current || selectedSide !== side) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newOffset = { x: dragRef.current.origX + dx, y: dragRef.current.origY + dy };
    if (side === 'first') setFirstOffset(newOffset);
    else setSecondOffset(newOffset);
  }, [selectedSide]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleZoom = (delta: number) => {
    if (!selectedSide) return;
    const setter = selectedSide === 'first' ? setFirstScale : setSecondScale;
    setter((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleReset = () => {
    setFirstScale(1);
    setFirstOffset({ x: 0, y: 0 });
    setSecondScale(1);
    setSecondOffset({ x: 0, y: 0 });
  };

  const buildOptions = (drawGrid: boolean) => ({
    layout: settings.layout,
    ratio: settings.ratio,
    borderEnabled: settings.borderEnabled,
    borderWidth: settings.borderWidth,
    borderColor: settings.borderColor,
    dividerWidth: settings.dividerWidth,
    borderRadius: settings.borderRadius,
    firstScale,
    firstOffsetX: firstOffset.x,
    firstOffsetY: firstOffset.y,
    secondScale,
    secondOffsetX: secondOffset.x,
    secondOffsetY: secondOffset.y,
    drawGrid,
  });

  const handleSave = async (withGrid: boolean) => {
    if (!firstBlob || !secondBlob) return;
    setIsExporting(true);
    try {
      const suffix = withGrid ? 'grid' : 'clean';
      const blob = await createComparisonImage(firstBlob, secondBlob, buildOptions(withGrid));
      await shareOrDownloadImage(blob, `pitacame_compare_${suffix}_${dateStamp()}.jpg`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveBoth = async () => {
    if (!firstBlob || !secondBlob) return;
    setIsExporting(true);
    try {
      const [blobClean, blobGrid] = await Promise.all([
        createComparisonImage(firstBlob, secondBlob, buildOptions(false)),
        createComparisonImage(firstBlob, secondBlob, buildOptions(true)),
      ]);
      await shareOrDownloadImage(blobClean, `pitacame_compare_clean_${dateStamp()}.jpg`);
      // Small delay so browser handles two downloads
      await new Promise((r) => setTimeout(r, 500));
      await shareOrDownloadImage(blobGrid, `pitacame_compare_grid_${dateStamp()}.jpg`);
    } finally {
      setIsExporting(false);
    }
  };

  const backPath = state?.firstId ? '/gallery' : '/capture';

  if (!firstBlob || !secondBlob) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-black text-white">
        <p className="text-sm">画像が見つかりません</p>
        <button onClick={() => navigate(backPath)} className="mt-4 rounded-full bg-white/15 px-5 py-2 text-sm">
          戻る
        </button>
      </div>
    );
  }

  if (editingMosaic) {
    const blob = editingMosaic === 'first' ? firstBlob : secondBlob;
    return (
      <MosaicCanvas
        imageBlob={blob}
        onSave={(edited) => {
          if (editingMosaic === 'first') setFirstBlobOverride(edited);
          else setSecondBlobOverride(edited);
          setEditingMosaic(null);
        }}
        onCancel={() => setEditingMosaic(null)}
      />
    );
  }

  const isHorizontal = settings.layout === 'horizontal';

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-3 py-2 backdrop-blur-md" style={{ flexShrink: 0 }}>
        <button onClick={() => navigate(backPath)} className="flex items-center gap-1 text-xs font-medium">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>
        <span className="text-xs font-semibold">比較</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowGrid((v) => !v)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
              showGrid ? 'bg-[#3DC4A8]/70 text-white' : 'bg-white/10 text-white/45'
            }`}
          >
            グリッド
          </button>
        <button
          onClick={() => setShowSettings((v) => !v)}
          className={`rounded-lg p-1.5 transition ${showSettings ? 'bg-white/20' : 'hover:bg-white/10'}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        </div>
      </div>

      {/* Layout & Ratio toggles */}
      <div className="flex items-center justify-center gap-2 bg-slate-900/60 px-3 py-2" style={{ flexShrink: 0 }}>
        <div className="flex rounded-full bg-white/10 p-0.5">
          <button
            onClick={() => setSettings((s) => ({ ...s, layout: 'horizontal' }))}
            className={`rounded-full px-3 py-1 text-[10px] font-medium transition ${isHorizontal ? 'bg-[#3DC4A8] text-white' : 'text-white/60'}`}
          >
            左右
          </button>
          <button
            onClick={() => setSettings((s) => ({ ...s, layout: 'vertical' }))}
            className={`rounded-full px-3 py-1 text-[10px] font-medium transition ${!isHorizontal ? 'bg-[#3DC4A8] text-white' : 'text-white/60'}`}
          >
            上下
          </button>
        </div>
        <div className="h-4 w-px bg-white/20" />
        {RATIO_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSettings((s) => ({ ...s, ratio: opt.value }))}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
              settings.ratio === opt.value ? 'bg-[#5BB5E7] text-white' : 'bg-white/10 text-white/60'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Compare Frame */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-2 py-2">
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: RATIO_CSS[settings.ratio],
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            display: 'flex',
            flexDirection: isHorizontal ? 'row' : 'column',
            border: settings.borderEnabled ? `${settings.borderWidth}px solid ${settings.borderColor}` : 'none',
            borderRadius: settings.borderRadius > 0 ? `${settings.borderRadius}px` : undefined,
          }}
        >
          {/* First image */}
          <div
            className={`relative overflow-hidden ${selectedSide === 'first' ? 'ring-2 ring-[#3DC4A8]' : ''}`}
            style={{
              flex: 1,
              [isHorizontal ? 'borderRight' : 'borderBottom']: settings.borderEnabled
                ? `${settings.dividerWidth}px solid ${settings.borderColor}`
                : 'none',
            }}
            onPointerDown={(e) => handlePointerDown('first', e)}
            onPointerMove={(e) => handlePointerMove('first', e)}
            onPointerUp={handlePointerUp}
          >
            {firstSrc && (
              <img
                src={firstSrc}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full touch-none select-none"
                style={{
                  objectFit: 'contain',
                  transform: `scale(${firstScale}) translate(${firstOffset.x}px, ${firstOffset.y}px)`,
                }}
              />
            )}
            {showGrid && <GridOverlay />}
          </div>

          {/* Second image */}
          <div
            className={`relative overflow-hidden ${selectedSide === 'second' ? 'ring-2 ring-[#5BB5E7]' : ''}`}
            style={{ flex: 1 }}
            onPointerDown={(e) => handlePointerDown('second', e)}
            onPointerMove={(e) => handlePointerMove('second', e)}
            onPointerUp={handlePointerUp}
          >
            {secondSrc && (
              <img
                src={secondSrc}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full touch-none select-none"
                style={{
                  objectFit: 'contain',
                  transform: `scale(${secondScale}) translate(${secondOffset.x}px, ${secondOffset.y}px)`,
                }}
              />
            )}
            {showGrid && <GridOverlay />}
          </div>
        </div>
      </div>

      {/* Settings panel (collapsible) */}
      {showSettings && (
        <div className="space-y-3 border-t border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur" style={{ flexShrink: 0 }}>
          {/* Border toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">枠線</span>
            <button
              onClick={() => setSettings((s) => ({ ...s, borderEnabled: !s.borderEnabled }))}
              className={`relative h-6 w-11 rounded-full transition ${settings.borderEnabled ? 'bg-[#3DC4A8]' : 'bg-white/20'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.borderEnabled ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {settings.borderEnabled && (
            <>
              {/* Border width */}
              <div>
                <label className="text-[10px] text-white/50">枠線の太さ: {settings.borderWidth}px</label>
                <input
                  type="range" min="1" max="10" value={settings.borderWidth}
                  onChange={(e) => setSettings((s) => ({ ...s, borderWidth: Number(e.target.value) }))}
                  className="w-full accent-[#3DC4A8]"
                />
              </div>

              {/* Divider width */}
              <div>
                <label className="text-[10px] text-white/50">区切り線の太さ: {settings.dividerWidth}px</label>
                <input
                  type="range" min="0" max="10" value={settings.dividerWidth}
                  onChange={(e) => setSettings((s) => ({ ...s, dividerWidth: Number(e.target.value) }))}
                  className="w-full accent-[#3DC4A8]"
                />
              </div>

              {/* Border color */}
              <div>
                <label className="text-[10px] text-white/50">枠線の色</label>
                <div className="mt-1 flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSettings((s) => ({ ...s, borderColor: c }))}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        settings.borderColor === c ? 'border-[#3DC4A8] scale-110' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={settings.borderColor}
                    onChange={(e) => setSettings((s) => ({ ...s, borderColor: e.target.value }))}
                    className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                </div>
              </div>

              {/* Border radius */}
              <div>
                <label className="text-[10px] text-white/50">角丸: {settings.borderRadius}px</label>
                <input
                  type="range" min="0" max="30" value={settings.borderRadius}
                  onChange={(e) => setSettings((s) => ({ ...s, borderRadius: Number(e.target.value) }))}
                  className="w-full accent-[#3DC4A8]"
                />
              </div>
            </>
          )}

          {/* Mosaic */}
          <div className="flex gap-2">
            <button
              onClick={() => setEditingMosaic('first')}
              className="flex-1 rounded-lg bg-white/10 py-2 text-xs font-medium text-white/80 transition hover:bg-white/20"
            >
              1枚目 モザイク
            </button>
            <button
              onClick={() => setEditingMosaic('second')}
              className="flex-1 rounded-lg bg-white/10 py-2 text-xs font-medium text-white/80 transition hover:bg-white/20"
            >
              2枚目 モザイク
            </button>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="border-t border-white/10 bg-slate-900/80 px-3 py-2.5 backdrop-blur-md" style={{ flexShrink: 0 }}>
        {/* Zoom controls */}
        <div className="mb-2 flex items-center justify-center gap-3">
          <span className="text-[10px] text-white/50">
            {selectedSide === 'first' ? '1枚目 選択中' : selectedSide === 'second' ? '2枚目 選択中' : '画像をタップして選択'}
          </span>
          <button
            onClick={() => handleZoom(-0.1)}
            disabled={!selectedSide}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white disabled:opacity-30"
          >
            -
          </button>
          <button
            onClick={() => handleZoom(0.1)}
            disabled={!selectedSide}
            className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white disabled:opacity-30"
          >
            +
          </button>
          <button
            onClick={handleReset}
            className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-white/70"
          >
            リセット
          </button>
        </div>

        {/* Save buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={isExporting}
            className="flex-1 rounded-full bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
          >
            グリッドなし保存
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isExporting}
            className="flex-1 rounded-full bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] py-2.5 text-xs font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.97] disabled:opacity-50"
          >
            グリッド付き保存
          </button>
        </div>
        <button
          onClick={handleSaveBoth}
          disabled={isExporting}
          className="mt-1.5 w-full rounded-full border border-white/20 bg-white/10 py-2.5 text-xs font-semibold text-white/80 transition hover:bg-white/20 active:scale-[0.97] disabled:opacity-50"
        >
          {isExporting ? '出力中...' : '両方まとめて保存'}
        </button>
      </div>
    </div>
  );
}

function GridOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    />
  );
}
