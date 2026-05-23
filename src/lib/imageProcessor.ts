export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export type ComparisonLayout = 'horizontal' | 'vertical';

export async function createComparisonImage(
  referenceBlob: Blob,
  capturedBlob: Blob,
  layout: ComparisonLayout = 'horizontal',
): Promise<Blob> {
  const [referenceUrl, capturedUrl] = await Promise.all([
    blobToDataURL(referenceBlob),
    blobToDataURL(capturedBlob),
  ]);

  const [referenceImg, capturedImg] = await Promise.all([
    loadImage(referenceUrl),
    loadImage(capturedUrl),
  ]);

  const gap = 0;
  let dimensions: {
    totalW: number;
    totalH: number;
    referenceW: number;
    referenceH: number;
    capturedW: number;
    capturedH: number;
  };

  if (layout === 'horizontal') {
    // 両方を同じ幅に統一し、高さはアスペクト比に従う
    const targetW = Math.min(referenceImg.width, capturedImg.width);
    const referenceH = Math.round(referenceImg.height * (targetW / referenceImg.width));
    const capturedH = Math.round(capturedImg.height * (targetW / capturedImg.width));
    const maxH = Math.max(referenceH, capturedH);
    dimensions = {
      totalW: targetW * 2 + gap,
      totalH: maxH,
      referenceW: targetW,
      referenceH,
      capturedW: targetW,
      capturedH,
    };
  } else {
    const maxW = Math.max(referenceImg.width, capturedImg.width);
    const referenceH = referenceImg.height * (maxW / referenceImg.width);
    const capturedH = capturedImg.height * (maxW / capturedImg.width);
    dimensions = {
      totalW: maxW,
      totalH: referenceH + capturedH + gap,
      referenceW: maxW,
      referenceH,
      capturedW: maxW,
      capturedH,
    };
  }

  const { totalW, totalH, referenceW, referenceH, capturedW, capturedH } = dimensions;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);

  if (layout === 'horizontal') {
    const refY = Math.round((totalH - referenceH) / 2);
    const capY = Math.round((totalH - capturedH) / 2);
    ctx.drawImage(referenceImg, 0, refY, referenceW, referenceH);
    ctx.drawImage(capturedImg, referenceW + gap, capY, capturedW, capturedH);
  } else {
    ctx.drawImage(referenceImg, 0, 0, referenceW, referenceH);
    ctx.drawImage(capturedImg, 0, referenceH + gap, capturedW, capturedH);
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

/** 画像を3:4にセンタークロップし、指定幅にリサイズする */
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
