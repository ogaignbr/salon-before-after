export function applyMosaicToRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  blockSize: number,
) {
  const imageData = ctx.getImageData(x, y, w, h);
  const { data } = imageData;

  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
          const i = ((by + dy) * w + (bx + dx)) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
          const i = ((by + dy) * w + (bx + dx)) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      }
    }
  }

  ctx.putImageData(imageData, x, y);
}

export function applyMosaicCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  blockSize: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const x = Math.max(0, Math.floor(cx - radius));
  const y = Math.max(0, Math.floor(cy - radius));
  const x2 = Math.min(canvasWidth, Math.ceil(cx + radius));
  const y2 = Math.min(canvasHeight, Math.ceil(cy + radius));
  const w = x2 - x;
  const h = y2 - y;
  if (w <= 0 || h <= 0) return;

  const imageData = ctx.getImageData(x, y, w, h);
  const { data } = imageData;

  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      const blockCx = x + bx + blockSize / 2;
      const blockCy = y + by + blockSize / 2;
      const dist = Math.sqrt((blockCx - cx) ** 2 + (blockCy - cy) ** 2);
      if (dist > radius) continue;

      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
          const i = ((by + dy) * w + (bx + dx)) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
        for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
          const i = ((by + dy) * w + (bx + dx)) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }
      }
    }
  }

  ctx.putImageData(imageData, x, y);
}
