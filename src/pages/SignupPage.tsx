import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, startCheckout } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [issuedLoginId, setIssuedLoginId] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);
    const { error, loginId } = await signUp(email);
    setSubmitting(false);

    if (error) {
      setMessage(error);
      return;
    }
    if (!loginId) {
      setMessage(
        'IDの発行に失敗しました。ページを再読込してから、別のメールアドレスでお試しください。',
      );
      return;
    }
    setIssuedLoginId(loginId);
  };

  const onProceedToCheckout = async () => {
    setShowCloseConfirm(false);
    setMessage('');
    setSubmitting(true);
    try {
      const checkout = await startCheckout();
      if (checkout.error) {
        setMessage(checkout.error);
      }
    } catch {
      setMessage('通信に失敗しました。時間をおいてもう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  if (issuedLoginId) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6 relative">
          <h1 className="text-2xl font-black text-pink-500 text-center">IDが発行されました</h1>
          <p className="text-xs text-pink-400 text-center mt-2">
            ログインに必要な4桁のIDです。<br />必ずメモまたはスクリーンショットで保存してください。
          </p>

          <div className="mt-6 rounded-2xl bg-pink-50 border-2 border-pink-300 p-5 text-center">
            <p className="text-[11px] font-bold text-pink-500">あなたのログインID</p>
            <p className="text-5xl font-black text-rose-500 tracking-[0.4em] mt-2">
              {issuedLoginId}
            </p>
            <p className="text-[11px] text-pink-400 mt-2">初期PINは 0000 です</p>
          </div>

          <p className="text-[11px] text-rose-500 font-bold text-center mt-4 leading-relaxed">
            このIDはこの画面でしか確認できません。<br />
            紛失時は管理者へのお問い合わせが必要です。
          </p>

          <button
            onClick={() => setShowCloseConfirm(true)}
            disabled={submitting}
            className="mt-6 w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50"
          >
            {submitting ? '遷移中...' : '閉じる'}
          </button>

          {message ? (
            <p className="mt-3 text-center text-xs font-bold text-rose-500">{message}</p>
          ) : null}

          {showCloseConfirm ? (
            <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center px-4">
              <div className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-2xl">
                <p className="text-sm font-bold text-pink-600 text-center leading-relaxed">
                  ログインに必要なIDになります。
                  <br />
                  メモやスクリーンショットは撮りましたか？
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setShowCloseConfirm(false)}
                    className="flex-1 py-2 bg-white border border-pink-300 text-pink-400 text-sm font-black rounded-xl"
                  >
                    いいえ
                  </button>
                  <button
                    onClick={onProceedToCheckout}
                    className="flex-1 py-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-sm font-black rounded-xl"
                  >
                    はい
                  </button>
                </div>
                <p className="text-[10px] text-pink-400 text-center mt-3">
                  「はい」を押すとカード登録画面に進みます。
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6">
        <h1 className="text-2xl font-black text-pink-500 text-center">新規登録</h1>
        <p className="text-xs text-pink-300 text-center mt-2">
          7日間無料トライアル付き（カード登録必須）
        </p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs font-bold text-pink-400">メールアドレス</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-pink-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="example@salon.com"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white font-black rounded-2xl shadow-md active:scale-95 transition-transform disabled:opacity-50"
          >
            {submitting ? '登録中...' : 'IDを発行する'}
          </button>
          <p className="text-[11px] text-pink-400 leading-relaxed">
            ID発行後、Stripeの安全な決済ページでカード情報をご登録いただきます。<br />
            7日間は0円、解約しない場合のみ8日目から月額980円が自動で発生します。
          </p>
        </form>

        {message ? (
          <p className="mt-4 text-center text-xs font-bold text-rose-500">{message}</p>
        ) : null}

        <div className="mt-4 text-center">
          <button onClick={() => navigate('/')} className="text-xs text-pink-300 underline">
            すでに登録済みの方はこちら
          </button>
        </div>
      </div>
    </div>
  );
}
