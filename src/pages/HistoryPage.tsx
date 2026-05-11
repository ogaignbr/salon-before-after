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
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      <div className="flex items-center px-4 py-3 bg-white border-b">
        <button onClick={() => navigate('/')} className="text-rose-500 font-bold text-sm">
          戻る
        </button>
        <h1 className="flex-1 text-center font-bold text-gray-800">撮影履歴</h1>
        <div className="w-10" />
      </div>

      <div className="px-4 py-3">
        <input
          type="text"
          placeholder="お客様名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
      </div>

      <div className="flex-1 px-4 space-y-2 pb-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {sessions.length === 0 ? '撮影履歴がありません' : '該当する結果がありません'}
          </div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => s.afterImage && navigate(`/preview/${s.id}`)}
              className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm active:bg-gray-50 cursor-pointer"
            >
              {s.thumbUrl && (
                <img
                  src={s.thumbUrl}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{s.customerName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString('ja-JP')} ・{' '}
                  {s.part === 'face' ? '顔' : '体'}
                  {!s.afterImage && (
                    <span className="ml-1 text-orange-500">（アフター未撮影）</span>
                  )}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(s.id!, e)}
                className="p-2 text-gray-400 hover:text-red-500"
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
