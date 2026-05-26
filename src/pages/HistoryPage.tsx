// This page is no longer used (replaced by GalleryPage)
import { useNavigate } from 'react-router-dom';

export default function HistoryPage() {
  const navigate = useNavigate();
  return (
    <div className="flex h-dvh items-center justify-center bg-black text-white">
      <button onClick={() => navigate('/home')} className="rounded-full bg-white/15 px-5 py-2 text-sm">
        ホームに戻る
      </button>
    </div>
  );
}
