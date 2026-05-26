import { useRef, useEffect, useState, useCallback } from 'react';
import { blobToDataURL } from '../lib/imageProcessor';
import { applyMosaicToRegion, applyMosaicCircle } from '../lib/mosaic';
import { useFaceDetection } from '../hooks/useFaceDetection';

interface Props {
  imageBlob: Blob;
  onSave: (editedBlob: Blob) => void;
  onCancel: () => void;
}

export default function MosaicCanvas({ imageBlob, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(30);
  const [blockSize, setBlockSize] = useState(15);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const { detectFaces, isLoading } = useFaceDetection();

  useEffect(() => {
    const loadImage = async () => {
      const url = await blobToDataURL(imageBlob);
      const img = new Image();
      img.onload = () => {
        originalImageRef.current = img;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const maxW = window.innerWidth;
        const maxH = window.innerHeight * 0.65;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
      };
      img.src = url;
    };
    loadImage();
  }, [imageBlob]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const applyBrush = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    applyMosaicCircle(ctx, x, y, brushSize, blockSize, canvas.width, canvas.height);
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getPos(e);
    applyBrush(x, y);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    applyBrush(x, y);
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const newHistory = history.slice(0, -1);
    ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    setHistory(newHistory);
  };

  const handleAutoDetect = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const detections = await detectFaces(canvas);
    if (detections.length === 0) {
      alert('顔が検出されませんでした。手動でモザイクを適用してください。');
      return;
    }
    for (const det of detections) {
      const { x, y, width, height } = det.box;
      const margin = Math.round(width * 0.15);
      const mx = Math.max(0, Math.round(x - margin));
      const my = Math.max(0, Math.round(y - margin));
      const mw = Math.min(canvas.width - mx, Math.round(width + margin * 2));
      const mh = Math.min(canvas.height - my, Math.round(height + margin * 2));
      applyMosaicToRegion(ctx, mx, my, mw, mh, blockSize);
    }
    setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  }, [detectFaces, blockSize]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white border-b border-white/10">
        <button onClick={onCancel} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">キャンセル</button>
        <span className="font-semibold text-sm">モザイク加工</span>
        <button onClick={handleSave} className="text-sm text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">適用</button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-2">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full touch-none rounded-xl"
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
        />
      </div>

      {/* Controls */}
      <div className="bg-slate-800 backdrop-blur px-4 py-3 space-y-3 rounded-t-2xl border-t border-white/10">
        <div className="flex gap-2">
          <button
            onClick={handleAutoDetect}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-semibold disabled:opacity-50 hover:bg-cyan-700 active:scale-[0.98] transition-all"
          >
            {isLoading ? '読み込み中...' : '顔を自動検出'}
          </button>
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium disabled:opacity-30 hover:bg-white/20 active:scale-[0.98] transition-all"
          >
            戻す
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium">ブラシサイズ: {brushSize}</label>
          <input
            type="range"
            min="10"
            max="80"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium">モザイク強度: {blockSize}</label>
          <input
            type="range"
            min="5"
            max="40"
            value={blockSize}
            onChange={(e) => setBlockSize(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>
      </div>
    </div>
  );
}
