import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [issuedId, setIssuedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

    setIssuedId(loginId);
    setMessage('登録が完了しました。初回PINは 0000 です。ログイン後に変更してください。');
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm bg-white/90 rounded-3xl shadow-xl border border-pink-100 p-6">
        <h1 className="text-2xl font-black text-pink-500 text-center">新規登録</h1>
        <p className="text-xs text-pink-300 text-center mt-2">7日間無料トライアル付き</p>

        {!issuedId ? (
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
              {submitting ? '登録中...' : '無料トライアルを開始'}
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl bg-pink-50 border border-pink-200 p-4 text-center space-y-2">
            <p className="text-sm font-black text-pink-500">発行されたログインID</p>
            <p className="text-3xl font-black text-rose-500 tracking-widest">{issuedId}</p>
            <p className="text-xs text-pink-400">初期PINは 0000 です</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-2 w-full py-2 bg-white border border-pink-200 rounded-xl text-pink-500 text-sm font-black"
            >
              ログインへ進む
            </button>
          </div>
        )}

        {message ? (
          <p className="mt-4 text-center text-xs font-bold text-pink-500">{message}</p>
        ) : null}

        <div className="mt-4 text-center">
          <button onClick={() => navigate('/login')} className="text-xs text-pink-300 underline">
            すでに登録済みの方はこちら
          </button>
        </div>
      </div>
    </div>
  );
}
