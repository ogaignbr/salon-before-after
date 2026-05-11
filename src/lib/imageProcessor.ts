export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function createComparisonImage(
  beforeBlob: Blob,
  afterBlob: Blob,
): Promise<Blob> {
  const [beforeUrl, afterUrl] = await Promise.all([
    blobToDataURL(beforeBlob),
    blobToDataURL(afterBlob),
  ]);

  const [beforeImg, afterImg] = await Promise.all([
    loadImage(beforeUrl),
    loadImage(afterUrl),
  ]);

  const maxH = Math.max(beforeImg.height, afterImg.height);
  const beforeW = beforeImg.width * (maxH / beforeImg.height);
  const afterW = afterImg.width * (maxH / afterImg.height);
  const gap = 4;
  const padding = 20;
  const labelHeight = 40;
  const totalW = beforeW + afterW + gap + padding * 2;
  const totalH = maxH + padding * 2 + labelHeight;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);

  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#374151';
  ctx.fillText('BEFORE', padding + beforeW / 2, padding + 26);
  ctx.fillText('AFTER', padding + beforeW + gap + afterW / 2, padding + 26);

  const imgY = padding + labelHeight;
  ctx.drawImage(beforeImg, padding, imgY, beforeW, maxH);
  ctx.drawImage(afterImg, padding + beforeW + gap, imgY, afterW, maxH);

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  const lineX = padding + beforeW + gap / 2;
  ctx.beginPath();
  ctx.moveTo(lineX, imgY);
  ctx.lineTo(lineX, imgY + maxH);
  ctx.stroke();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.92);
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
