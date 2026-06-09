import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { CaptureOutputKind, CapturePlan, CapturePurpose } from '../types';
import pitacameLogo from '../../ぴたカメロゴ.png';

type PurposeOption = {
  id: CapturePurpose;
  label: string;
  short: string;
  icon: string;
  style: CapturePlan['style'];
  mediaType: CapturePlan['mediaType'];
  defaultOutput: CaptureOutputKind;
};

const PURPOSES: PurposeOption[] = [
  {
    id: 'face',
    label: '顔全体',
    short: 'ゴースト',
    style: 'ghost',
    mediaType: 'photo',
    defaultOutput: 'both',
    icon: 'M15.75 9A3.75 3.75 0 1112 5.25 3.75 3.75 0 0115.75 9z M5.25 20.25a6.75 6.75 0 0113.5 0',
  },
  {
    id: 'skin',
    label: '肌',
    short: 'ゴースト',
    style: 'ghost',
    mediaType: 'photo',
    defaultOutput: 'both',
    icon: 'M12 3.75c3.75 4.25 5.25 7.25 5.25 10A5.25 5.25 0 116.75 13.75c0-2.75 1.5-5.75 5.25-10z',
  },
  {
    id: 'eyes',
    label: '目元',
    short: 'ゴースト',
    style: 'ghost',
    mediaType: 'photo',
    defaultOutput: 'both',
    icon: 'M2.25 12s3.75-5.25 9.75-5.25S21.75 12 21.75 12 18 17.25 12 17.25 2.25 12 2.25 12z M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z',
  },
  {
    id: 'mouth',
    label: '歯・口元',
    short: 'ゴースト',
    style: 'ghost',
    mediaType: 'photo',
    defaultOutput: 'both',
    icon: 'M6 13.5c1.5 2.25 3.5 3.25 6 3.25s4.5-1 6-3.25M5.25 10.5c2.25-1.5 4.5-2.25 6.75-2.25s4.5.75 6.75 2.25',
  },
  {
    id: 'body',
    label: '全身・体',
    short: '左右比較',
    style: 'compare',
    mediaType: 'photo',
    defaultOutput: 'side-by-side',
    icon: 'M12 3.75a2.25 2.25 0 110 4.5 2.25 2.25 0 010-4.5z M9.75 21l.75-6-2.25-3.75m6 9.75l-.75-6 2.25-3.75M8.25 10.5h7.5',
  },
  {
    id: 'product',
    label: '商品・その他',
    short: '左右比較',
    style: 'compare',
    mediaType: 'photo',
    defaultOutput: 'side-by-side',
    icon: 'M3.75 7.5L12 3l8.25 4.5M4.5 7.5V18L12 22.5 19.5 18V7.5M12 12l7.5-4.5M12 12L4.5 7.5M12 12v10.5',
  },
  {
    id: 'video',
    label: '動画比較',
    short: '左右比較',
    style: 'compare',
    mediaType: 'video',
    defaultOutput: 'side-by-side',
    icon: 'M4.5 6.75A2.25 2.25 0 016.75 4.5h7.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-7.5A2.25 2.25 0 014.5 17.25V6.75z M16.5 10.5l3.75-2.25v7.5L16.5 13.5',
  },
];

const OUTPUTS: { id: CaptureOutputKind; label: string; icon: string; photoOnly?: boolean }[] = [
  { id: 'side-by-side', label: '左右で見せる', icon: 'M4.5 5.25h6v13.5h-6V5.25z M13.5 5.25h6v13.5h-6V5.25z' },
  { id: 'vertical', label: '上下で見せる', icon: 'M5.25 4.5h13.5v6H5.25v-6z M5.25 13.5h13.5v6H5.25v-6z' },
  { id: 'overlay', label: '重ねて見せる', icon: 'M8.25 6.75h9v9h-9v-9z M5.25 9.75h9v9h-9v-9z', photoOnly: true },
  { id: 'both', label: '左右 + 重ね', icon: 'M4.5 5.25h5.25v13.5H4.5V5.25z M11.25 5.25h5.25v5.25h-5.25V5.25z M11.25 12.75h5.25v6h-5.25v-6z', photoOnly: true },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [purposeId, setPurposeId] = useState<CapturePurpose>('face');
  const selectedPurpose = PURPOSES.find((p) => p.id === purposeId) ?? PURPOSES[0];
  const [outputKind, setOutputKind] = useState<CaptureOutputKind>(selectedPurpose.defaultOutput);

  const availableOutputs = useMemo(() => {
    if (selectedPurpose.mediaType === 'video') return OUTPUTS.filter((o) => o.id === 'side-by-side');
    return OUTPUTS;
  }, [selectedPurpose.mediaType]);

  const selectPurpose = (option: PurposeOption) => {
    setPurposeId(option.id);
    setOutputKind(option.defaultOutput);
  };

  const startCapture = () => {
    const plan: CapturePlan = {
      purpose: selectedPurpose.id,
      style: selectedPurpose.style,
      mediaType: selectedPurpose.mediaType,
      outputKind,
      title: selectedPurpose.label,
      beforeLabel: selectedPurpose.mediaType === 'video' ? 'ビフォー動画' : 'ビフォー画像',
      afterLabel: selectedPurpose.mediaType === 'video' ? 'アフター動画' : 'アフター写真',
    };
    navigate('/capture-after', { state: { plan } });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(160deg,#F0FBF8_0%,#EDF7FB_48%,#EAF5FB_100%)] text-[#1B3A5C] dark:bg-[linear-gradient(160deg,#060913_0%,#0b1020_45%,#111827_100%)] dark:text-slate-100">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-5 pt-4">
        <div className="mb-4 flex items-center justify-between rounded-[12px] border border-[#A8DDE5]/30 bg-white/90 px-4 py-2.5 shadow-[0_10px_26px_rgba(60,140,170,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
          <p className="max-w-[220px] truncate text-[11px] font-medium text-[#5B7689] dark:text-slate-400">{user?.email ?? '----'}</p>
          <button
            onClick={async () => {
              if (signingOut) return;
              setSigningOut(true);
              await signOut();
              navigate('/', { replace: true });
            }}
            disabled={signingOut}
            className="text-[11px] font-semibold text-[#5B7689] hover:text-[#1B3A5C] dark:text-slate-300 dark:hover:text-slate-100"
          >
            {signingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <img src={pitacameLogo} alt="ぴたカメ" className="h-14 w-14 rounded-[12px] object-cover shadow-sm" />
          <div>
            <h1 className="text-xl font-black">何を撮りますか？</h1>
            <p className="text-xs font-medium text-[#5B7689] dark:text-slate-400">目的を選ぶと、撮影方法を自動で整えます。</p>
          </div>
        </div>

        <section className="space-y-2">
          <div className="grid grid-cols-2 gap-2.5">
            {PURPOSES.map((option) => {
              const active = option.id === selectedPurpose.id;
              return (
                <button
                  key={option.id}
                  onClick={() => selectPurpose(option)}
                  className={`relative flex min-h-[86px] flex-col items-start justify-between rounded-[12px] border p-3 text-left shadow-sm transition active:scale-[0.99] ${
                    active
                      ? 'border-red-400 bg-white ring-2 ring-red-400/70 dark:border-red-400 dark:bg-slate-900'
                      : 'border-[#A8DDE5]/35 bg-white/88 hover:border-[#5BB5E7] dark:border-white/10 dark:bg-slate-900/45'
                  }`}
                >
                  <svg className={`h-7 w-7 ${option.mediaType === 'video' ? 'text-red-500' : 'text-[#3DC4A8]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={option.icon} />
                  </svg>
                  <div>
                    <div className="text-sm font-black">{option.label}</div>
                    <div className="mt-0.5 text-[10px] font-bold text-[#5B7689] dark:text-slate-400">{option.short}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-2 text-sm font-black">完成イメージ</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {availableOutputs.map((option) => {
              const active = option.id === outputKind;
              return (
                <button
                  key={option.id}
                  onClick={() => setOutputKind(option.id)}
                  className={`flex min-h-[70px] items-center gap-2 rounded-[12px] border px-3 text-left transition active:scale-[0.99] ${
                    active
                      ? 'border-red-400 bg-white ring-2 ring-red-400/70 dark:bg-slate-900'
                      : 'border-[#A8DDE5]/35 bg-white/82 dark:border-white/10 dark:bg-slate-900/45'
                  }`}
                >
                  <svg className="h-7 w-7 shrink-0 text-[#5BB5E7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={option.icon} />
                  </svg>
                  <span className="text-xs font-black leading-tight">{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-auto pt-5">
          <button
            onClick={startCapture}
            className="sheen-wrap flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#5BB5E7]/30 bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_48%,#5BB5E7_100%)] px-4 py-4 text-lg font-black text-white shadow-[0_8px_18px_rgba(70,160,200,0.24)] active:scale-[0.985]"
          >
            撮影をはじめる
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/compare')}
            className="mt-2 w-full rounded-[12px] border border-[#A8DDE5]/35 bg-white/80 py-3 text-sm font-bold text-[#1B3A5C] dark:border-white/10 dark:bg-slate-900/45 dark:text-slate-100"
          >
            既存素材を並べる
          </button>
          <div className="mt-4 flex justify-center gap-4 text-xs font-medium text-[#5B7689] dark:text-slate-400">
            <button onClick={() => navigate('/terms')}>利用規約</button>
            <button onClick={() => navigate('/privacy')}>プライバシー</button>
          </div>
        </div>
      </div>
    </div>
  );
}
