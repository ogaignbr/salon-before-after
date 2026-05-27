export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export type ComparisonLayout = 'horizontal' | 'vertical';

const RATIO_VALUES: Record<string, number> = {
  '3:4': 3 / 4,
  '9:16': 9 / 16,
  '4:3': 4 / 3,
};

export interface ComparisonOptions {
  layout: ComparisonLayout;
  ratio: string;
  borderEnabled: boolean;
  borderWidth: number;
  borderColor: string;
  dividerWidth: number;
  borderRadius: number;
  firstScale: number;
  firstOffsetX: number;
  firstOffsetY: number;
  secondScale: number;
  secondOffsetX: number;
  secondOffsetY: number;
  drawGrid?: boolean;
}

export async function createComparisonImage(
  firstBlob: Blob,
  secondBlob: Blob,
  options: ComparisonOptions,
): Promise<Blob> {
  const [firstUrl, secondUrl] = await Promise.all([
    blobToDataURL(firstBlob),
    blobToDataURL(secondBlob),
  ]);
  const [firstImg, secondImg] = await Promise.all([
    loadImage(firstUrl),
    loadImage(secondUrl),
  ]);

  const {
    layout, ratio, borderEnabled, borderWidth, borderColor,
    dividerWidth, borderRadius,
    firstScale, firstOffsetX, firstOffsetY,
    secondScale, secondOffsetX, secondOffsetY,
  } = options;

  const border = borderEnabled ? borderWidth : 0;
  const divider = borderEnabled ? dividerWidth : 0;
  const aspectRatio = RATIO_VALUES[ratio] ?? 3 / 4;

  // Output size: base on 1080px width
  const baseSize = 1080;
  let totalW: number;
  let totalH: number;

  if (aspectRatio >= 1) {
    // Landscape
    totalW = baseSize;
    totalH = Math.round(baseSize / aspectRatio);
  } else {
    // Portrait
    totalH = Math.round(baseSize / aspectRatio);
    totalW = baseSize;
  }

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // Background (border color or white)
  ctx.fillStyle = borderEnabled ? borderColor : '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);

  // Clip for border radius
  if (borderRadius > 0 && borderEnabled) {
    ctx.beginPath();
    const r = borderRadius * 2; // Scale radius for output
    ctx.roundRect(0, 0, totalW, totalH, r);
    ctx.clip();
    ctx.fillStyle = borderColor;
    ctx.fillRect(0, 0, totalW, totalH);
  }

  // Calculate cell areas
  let firstArea: { x: number; y: number; w: number; h: number };
  let secondArea: { x: number; y: number; w: number; h: number };

  if (layout === 'horizontal') {
    const cellW = Math.floor((totalW - border * 2 - divider) / 2);
    const cellH = totalH - border * 2;
    firstArea = { x: border, y: border, w: cellW, h: cellH };
    secondArea = { x: border + cellW + divider, y: border, w: cellW, h: cellH };
  } else {
    const cellW = totalW - border * 2;
    const cellH = Math.floor((totalH - border * 2 - divider) / 2);
    firstArea = { x: border, y: border, w: cellW, h: cellH };
    secondArea = { x: border, y: border + cellH + divider, w: cellW, h: cellH };
  }

  // Draw image into cell with scale and offset
  const drawImageInCell = (
    img: HTMLImageElement,
    area: { x: number; y: number; w: number; h: number },
    scale: number,
    offsetX: number,
    offsetY: number,
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.w, area.h);
    ctx.clip();

    // Cover fit (fill cell, crop overflow)
    const imgAspect = img.width / img.height;
    const cellAspect = area.w / area.h;
    let drawW: number, drawH: number;
    if (imgAspect > cellAspect) {
      drawH = area.h;
      drawW = area.h * imgAspect;
    } else {
      drawW = area.w;
      drawH = area.w / imgAspect;
    }

    // Scale relative to output pixel size
    const scaleRatio = totalW / (window.innerWidth || 420);
    const scaledOffsetX = offsetX * scaleRatio;
    const scaledOffsetY = offsetY * scaleRatio;

    const cx = area.x + area.w / 2 + scaledOffsetX;
    const cy = area.y + area.h / 2 + scaledOffsetY;

    drawW *= scale;
    drawH *= scale;

    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    ctx.restore();
  };

  drawImageInCell(firstImg, firstArea, firstScale, firstOffsetX, firstOffsetY);
  drawImageInCell(secondImg, secondArea, secondScale, secondOffsetX, secondOffsetY);

  // Draw grid overlay on each cell
  if (options.drawGrid) {
    const drawGridInArea = (area: { x: number; y: number; w: number; h: number }) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(area.x, area.y, area.w, area.h);
      ctx.clip();
      const gridSize = 40; // px in output
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      for (let x = area.x + gridSize; x < area.x + area.w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, area.y);
        ctx.lineTo(x, area.y + area.h);
        ctx.stroke();
      }
      for (let y = area.y + gridSize; y < area.y + area.h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(area.x, y);
        ctx.lineTo(area.x + area.w, y);
        ctx.stroke();
      }
      ctx.restore();
    };
    drawGridInArea(firstArea);
    drawGridInArea(secondArea);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92);
  });
}

export async function shareOrDownloadImage(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });

  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function cropTo3x4(blob: Blob, targetWidth = 1080): Promise<Blob> {
  const url = await blobToDataURL(blob);
  const img = await loadImage(url);

  const targetRatio = 3 / 4;
  const imgRatio = img.width / img.height;

  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > targetRatio) {
    sw = Math.round(img.height * targetRatio);
    sx = Math.round((img.width - sw) / 2);
  } else if (imgRatio < targetRatio) {
    sh = Math.round(img.width / targetRatio);
    sy = Math.round((img.height - sh) / 2);
  }

  const targetHeight = Math.round(targetWidth / targetRatio);
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
