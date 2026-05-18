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
        <span className="text-[10px] font-semibold text-slate-400 mb-1.5 bg-slate-100 px-3 py-0.5 rounded-full uppercase tracking-wider">Before</span>
        {beforeSrc && (
          <img src={beforeSrc} alt="Before" className="w-full rounded-xl object-cover aspect-[3/4] border border-slate-200 shadow-sm" />
        )}
      </div>
      <div className="flex-1 flex flex-col items-center">
        <span className="text-[10px] font-semibold text-indigo-500 mb-1.5 bg-indigo-50 px-3 py-0.5 rounded-full uppercase tracking-wider">After</span>
        {afterSrc && (
          <img src={afterSrc} alt="After" className="w-full rounded-xl object-cover aspect-[3/4] border border-indigo-200 shadow-sm" />
        )}
      </div>
    </div>
  );
}
