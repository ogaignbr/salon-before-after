import { useEffect, useState } from 'react';
import { blobToDataURL } from '../lib/imageProcessor';

interface Props {
  imageBlob: Blob;
  opacity: number;
}

export default function GhostOverlay({ imageBlob, opacity }: Props) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    blobToDataURL(imageBlob).then(setSrc);
  }, [imageBlob]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt="ビフォー写真オーバーレイ"
      className="absolute inset-0 w-full h-full object-cover pointer-events-none z-5"
      style={{ opacity }}
    />
  );
}
