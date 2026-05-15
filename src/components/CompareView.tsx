import { useEffect, useState } from 'react';
import { blobToDataURL } from '../lib/imageProcessor';

interface Props {
  beforeBlob: Blob;
  afterBlob: Blob;
}

export default function CompareView({ beforeBlob, afterBlob }: Props) {
  const [beforeSrc, setBeforeSrc] = useState('');
  const [afterSrc, setAfterSrc] = useState('');

  useEffect(() => {
    blobToDataURL(beforeBlob).then(setBeforeSrc);
    blobToDataURL(afterBlob).then(setAfterSrc);
  }, [beforeBlob, afterBlob]);

  return (
    <div className="flex gap-2 w-full">
      <div className="flex-1 flex flex-col items-center">
        <span className="text-xs font-black text-pink-400 mb-1 bg-pink-100 px-3 py-0.5 rounded-full">BEFORE</span>
        {beforeSrc && (
          <img src={beforeSrc} alt="Before" className="w-full rounded-2xl object-cover aspect-[3/4] border-2 border-pink-200 shadow-sm" />
        )}
      </div>
      <div className="flex-1 flex flex-col items-center">
        <span className="text-xs font-black text-rose-400 mb-1 bg-rose-100 px-3 py-0.5 rounded-full">AFTER</span>
        {afterSrc && (
          <img src={afterSrc} alt="After" className="w-full rounded-2xl object-cover aspect-[3/4] border-2 border-rose-200 shadow-sm" />
        )}
      </div>
    </div>
  );
}
