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
    <div className="flex gap-1 w-full">
      <div className="flex-1 flex flex-col items-center">
        <span className="text-xs font-bold text-gray-500 mb-1">BEFORE</span>
        {beforeSrc && (
          <img src={beforeSrc} alt="Before" className="w-full rounded-lg object-cover aspect-[3/4]" />
        )}
      </div>
      <div className="flex-1 flex flex-col items-center">
        <span className="text-xs font-bold text-gray-500 mb-1">AFTER</span>
        {afterSrc && (
          <img src={afterSrc} alt="After" className="w-full rounded-lg object-cover aspect-[3/4]" />
        )}
      </div>
    </div>
  );
}
