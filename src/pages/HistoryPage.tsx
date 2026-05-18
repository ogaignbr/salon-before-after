import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { blobToDataURL } from '../lib/imageProcessor';
import type { Session } from '../types';

interface SessionWithThumb extends Session {
  thumbUrl?: string;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionWithThumb[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    db.sessions
      .orderBy('createdAt')
      .reverse()
      .toArray()
      .then(async (list) => {
        const withThumbs = await Promise.all(
          list.map(async (s) => ({
            ...s,
            thumbUrl: await blobToDataURL(s.beforeImage),
          })),
        );
        setSessions(withThumbs);
      });
  }, []);

  const filtered = sessions.filter((s) =>
    s.customerName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('この撮影データを削除しますか？')) return;
    await db.sessions.delete(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex flex-col relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-20 right-4 text-pink-200 text-xl animate-sparkle">&#9829;</div>
      <div className="absolute bottom-20 left-4 text-yellow-200 text-lg animate-sparkle" style={{ animationDelay: '1s' }}>&#9733;</div>

      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-white/70 backdrop-blur-sm border-b border-pink-100">
        <button onClick={() => navigate('/home')} className="text-pink-400 font-bold text-sm flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          もどる
        </button>
        <h1 className="flex-1 text-center font-black text-pink-500 text-base">&#128247; 撮影きろく</h1>
        <div className="w-10" />
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <input
          type="text"
          placeholder="&#128269; お客様名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border-2 border-pink-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 text-gray-700 placeholder-pink-300"
        />
      </div>

      {/* List */}
      <div className="flex-1 px-4 space-y-2 pb-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="text-4xl mb-3">&#128247;</div>
            <p className="text-pink-300 text-sm font-bold">
              {sessions.length === 0 ? 'まだ撮影きろくがありません' : '該当する結果がありません'}
            </p>
          </div>
        ) : (
          filtered.map((s, i) => (
            <div
              key={s.id}
              onClick={() => s.afterImage ? navigate(`/preview/${s.id}`) : navigate(`/capture?session=${s.id}`)}
              className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-pink-100 active:scale-[0.98] transition-transform cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {s.thumbUrl && (
                <img
                  src={s.thumbUrl}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border-2 border-pink-100"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-pink-600 text-sm truncate">{s.customerName}</p>
                <p className="text-xs text-pink-400 font-bold">
                  {new Date(s.createdAt).toLocaleDateString('ja-JP')} ・{' '}
                  {s.part === 'face' ? '&#128102; 顔' : '&#128131; 体'}
                  {!s.afterImage && (
                    <span className="ml-1 inline-block bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full text-[10px] font-black">
                      アフター未撮影
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(s.id!, e)}
                className="p-2 text-pink-200 hover:text-red-400 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
