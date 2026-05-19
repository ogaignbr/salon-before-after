import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { blobToDataURL } from '../lib/imageProcessor';
import type { Session } from '../types';
import { AppFrame, AppHeader } from '../components/AppFrame';

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
    <AppFrame>
      <AppHeader title="記録一覧" onBack={() => navigate('/home')} backLabel="ホーム" />

      {/* Search */}
      <div className="mb-3 rounded-[16px] border border-[#B9A7FF]/30 bg-[rgba(255,255,255,0.92)] px-3 py-3 shadow-[0_12px_32px_rgba(85,70,180,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_16px_34px_-26px_rgba(45,74,152,0.85)]">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B4CFF] dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="顧客名で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[10px] border border-[#B8A8F8] bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-[#161B5C] outline-none transition-all placeholder:text-[#9A9AB0] focus:border-[#6B4CFF] focus:ring-2 focus:ring-[#6B4CFF]/20 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 space-y-2 overflow-y-auto px-1 pb-2">
        {filtered.length === 0 ? (
          <div className="animate-fade-in py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.92)] dark:bg-slate-900/50">
              <svg className="h-6 w-6 text-[#B9A7FF] dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#6B6F8A] dark:text-slate-500">
              {sessions.length === 0 ? 'まだ記録がありません' : '該当する記録が見つかりません'}
            </p>
          </div>
        ) : (
          filtered.map((s, i) => (
            <div
              key={s.id}
              onClick={() => s.afterImage ? navigate(`/preview/${s.id}`) : navigate(`/capture?session=${s.id}`)}
              className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-[#B9A7FF]/30 bg-[rgba(255,255,255,0.94)] p-3 shadow-[0_10px_28px_rgba(85,70,180,0.10)] backdrop-blur-xl transition-transform active:scale-[0.99] dark:border-white/10 dark:bg-slate-900/45 dark:shadow-[0_16px_34px_-26px_rgba(45,74,152,0.85)] animate-slide-up"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              {s.thumbUrl && (
                <img
                  src={s.thumbUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-[10px] border border-[#B9A7FF]/20 object-cover dark:border-white/15"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-[#161B5C] dark:text-slate-100">{s.customerName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs font-medium text-[#6B6F8A] dark:text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                  <span className="text-xs text-[#DCD7FF] dark:text-slate-600">|</span>
                  <p className="text-xs font-medium text-[#6B6F8A] dark:text-slate-500">
                    {s.part === 'face' ? '顔' : '体'}
                  </p>
                  {!s.afterImage && (
                    <span className="ml-1 inline-block rounded-full border border-amber-300/70 bg-amber-50/90 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:border-amber-300/25 dark:bg-amber-500/10 dark:text-amber-300">
                      未完了
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(s.id!, e)}
                className="p-2 text-[#B9A7FF] transition hover:text-[#E5486D] dark:text-slate-500 dark:hover:text-rose-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </AppFrame>
  );
}
