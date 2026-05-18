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
    if (!confirm('Delete this record?')) return;
    await db.sessions.delete(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-white border-b border-slate-100">
        <button onClick={() => navigate('/home')} className="text-indigo-600 font-medium text-sm flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="flex-1 text-center font-bold text-slate-800 text-sm">Records</h1>
        <div className="w-10" />
      </div>

      {/* Search */}
      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 text-slate-700 placeholder-slate-300 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-3 space-y-2 pb-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              {sessions.length === 0 ? 'No records yet' : 'No results found'}
            </p>
          </div>
        ) : (
          filtered.map((s, i) => (
            <div
              key={s.id}
              onClick={() => s.afterImage ? navigate(`/preview/${s.id}`) : navigate(`/capture?session=${s.id}`)}
              className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-slate-100 active:scale-[0.99] transition-transform cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              {s.thumbUrl && (
                <img
                  src={s.thumbUrl}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-slate-100"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-700 text-sm truncate">{s.customerName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-400 font-medium">
                    {new Date(s.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                  <span className="text-xs text-slate-300">|</span>
                  <p className="text-xs text-slate-400 font-medium">
                    {s.part === 'face' ? 'Face' : 'Body'}
                  </p>
                  {!s.afterImage && (
                    <span className="ml-1 inline-block bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-amber-200">
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(s.id!, e)}
                className="p-2 text-slate-300 hover:text-red-400 transition"
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
