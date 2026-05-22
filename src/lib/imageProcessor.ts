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
    const maxH = Math.max(referenceImg.height, capturedImg.height);
    const referenceW = referenceImg.width * (maxH / referenceImg.height);
    const capturedW = capturedImg.width * (maxH / capturedImg.height);
    dimensions = {
      totalW: referenceW + capturedW + gap,
      totalH: maxH,
      referenceW,
      referenceH: maxH,
      capturedW,
      capturedH: maxH,
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
    ctx.drawImage(referenceImg, 0, 0, referenceW, referenceH);
    ctx.drawImage(capturedImg, referenceW + gap, 0, capturedW, capturedH);
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
