import { useNavigate } from 'react-router-dom';
import { AppFrame, AppHeader } from '../components/AppFrame';

interface TocItem {
  id: string;
  label: string;
  description: string;
}

const TOC_ITEMS: TocItem[] = [
  { id: 'signup', label: '新規登録の方法', description: 'メール登録、無料トライアル開始、登録完了まで' },
  { id: 'login', label: 'ログインの方法', description: '登録メールアドレスとPINでログインする方法' },
  { id: 'change-pin', label: 'PIN変更の方法', description: '初回ログイン時のPIN変更方法' },
  { id: 'select-reference-and-shoot', label: '基準画像を選んで撮影する方法', description: '基準画像の選択から撮影開始まで' },
  { id: 'ghost-and-guides', label: 'ゴースト表示やガイド線の使い方', description: 'ゴースト濃度、グリッド、三分割、斜め線の使い方' },
  { id: 'mosaic', label: 'モザイク加工の方法', description: '基準画像・撮影画像のモザイク加工方法' },
  { id: 'save-images', label: '撮影画像・比較画像の保存方法', description: '撮影画像のみ、左右比較、上下比較で保存する方法' },
  { id: 'cancel', label: '解約方法', description: '利用規約ページから解約手続きへ進む方法' },
  { id: 'usecases-and-tips', label: '活用シーン', description: 'サロン、成長記録、商品撮影、作業記録などの活用例' },
];

export default function ManualPage() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <AppFrame>
      <AppHeader title="ぴたカメ 使い方説明書" onBack={() => navigate(-1)} backLabel="戻る" />

      <div className="flex-1 overflow-y-auto px-1 pb-2">
        <div className="rounded-[20px] border border-[#A8DDE5]/35 bg-[rgba(255,255,255,0.94)] p-5 text-[11px] leading-relaxed text-[#1B3A5C] shadow-[0_12px_32px_rgba(60,140,170,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:text-slate-300 dark:shadow-[0_20px_42px_-30px_rgba(30,46,105,0.9)]">
          {/* 目次 */}
          <section className="space-y-2">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">目次</h2>
            <p className="text-[11px] text-[#5B7689] dark:text-slate-400">気になる項目をタップすると、該当のセクションへ移動します。</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {TOC_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="group flex items-start gap-3 rounded-[14px] border border-[#A8DDE5]/40 bg-[#F0FBF8]/70 p-3 text-left transition-all hover:border-[#3DC4A8] hover:bg-[#F0FBF8] active:scale-[0.99] dark:border-cyan-300/20 dark:bg-cyan-500/10 dark:hover:border-cyan-300/50"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3DC4A8_0%,#48B8CB_50%,#5BB5E7_100%)] text-[10px] font-bold text-white">
                    {TOC_ITEMS.indexOf(item) + 1}
                  </span>
                  <span className="flex-1">
                    <span className="block text-xs font-bold text-[#1B3A5C] dark:text-slate-100">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] text-[#5B7689] dark:text-slate-400">{item.description}</span>
                  </span>
                  <svg className="mt-1 h-3.5 w-3.5 shrink-0 text-[#3DC4A8] transition-transform group-hover:translate-x-0.5 dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </section>

          {/* 新規登録 */}
          <section id="signup" className="mt-6 space-y-2 scroll-mt-20">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">1. 新規登録する</h2>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">1.1 新規登録画面を開く</h3>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>ログイン画面を開きます。</li>
              <li>「新規登録」を選択します。</li>
            </ol>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">1.2 メールアドレスを入力する</h3>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>登録に使うメールアドレスを入力します。</li>
              <li>「登録して無料トライアルを開始」を選択します。</li>
            </ol>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">1.3 決済画面で手続きを完了する</h3>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>Stripeの決済画面が表示されます。</li>
              <li>画面の案内に沿って支払い方法を入力します。</li>
              <li>登録を完了します。</li>
            </ol>
            <p className="rounded-[10px] border border-[#A8DDE5]/40 bg-[#F0FBF8]/60 p-2.5 text-[10.5px] text-[#1B3A5C]/85 dark:border-cyan-300/20 dark:bg-cyan-500/10 dark:text-cyan-100/85">
              補足: 7日間無料トライアル中に解約した場合、課金開始前に利用を停止できます。
            </p>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">1.4 登録完了画面を確認する</h3>
            <p>登録が完了すると、ログイン情報が表示されます。</p>
            <ul className="list-disc space-y-0.5 pl-5">
              <li>登録メールアドレス</li>
              <li>初期PIN: <code className="rounded bg-[#F0FBF8] px-1 py-0.5 text-[10px] font-mono text-[#3DC4A8] dark:bg-cyan-500/15 dark:text-cyan-300">0000</code></li>
            </ul>
            <p>初回ログイン時にPIN変更が必要です。</p>
          </section>

          {/* ログイン */}
          <section id="login" className="mt-6 space-y-2 scroll-mt-20">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">2. ログインする</h2>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">2.1 ログイン情報を入力する</h3>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>ログイン画面を開きます。</li>
              <li>登録メールアドレスを入力します。</li>
              <li>PINを入力します。</li>
              <li>「ログイン」を選択します。</li>
            </ol>

            <h3 id="change-pin" className="mt-3 text-xs font-bold text-[#1B3A5C] scroll-mt-20 dark:text-slate-200">2.2 初回PINを変更する</h3>
            <p>
              初回ログイン時は、初期PIN <code className="rounded bg-[#F0FBF8] px-1 py-0.5 text-[10px] font-mono text-[#3DC4A8] dark:bg-cyan-500/15 dark:text-cyan-300">0000</code> から任意の4桁PINへ変更します。
            </p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>新しい4桁PINを入力します。</li>
              <li>確認用に同じPINをもう一度入力します。</li>
              <li>「PINを変更」を選択します。</li>
              <li>新しいPINで再度ログインします。</li>
            </ol>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">2.3 ログアウトする</h3>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>ホーム画面の「ログアウト」を選択します。</li>
              <li>ログイン画面に戻ったことを確認します。</li>
            </ol>
          </section>

          {/* ホーム画面の見方 */}
          <section className="mt-6 space-y-2">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">3. ホーム画面の見方</h2>
            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">3.1 ホーム画面でできること</h3>
            <ul className="list-disc space-y-0.5 pl-5">
              <li>撮影を開始する</li>
              <li>利用規約を確認する</li>
              <li>プライバシーポリシーを確認する</li>
              <li>ログアウトする</li>
            </ul>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">3.2 撮影を開始する</h3>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>ホーム画面で「撮影を開始」を選択します。</li>
              <li>基準画像選択画面へ進みます。</li>
            </ol>
          </section>

          {/* 基準画像を選ぶ */}
          <section id="select-reference-and-shoot" className="mt-6 space-y-2 scroll-mt-20">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">4. 基準画像を選ぶ</h2>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">4.1 基準画像とは</h3>
            <p>基準画像とは、これから撮影する写真の構図を合わせるために使う画像です。</p>
            <p>例:</p>
            <ul className="list-disc space-y-0.5 pl-5">
              <li>施術前の写真</li>
              <li>前回撮影した写真</li>
              <li>商品写真の見本</li>
              <li>作業前の状態</li>
              <li>成長記録の前回画像</li>
            </ul>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">4.2 端末内の画像を選択する</h3>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>「基準画像を選択」を選択します。</li>
              <li>端末の写真フォルダから画像を選びます。</li>
              <li>選んだ画像のプレビューを確認します。</li>
              <li>「撮影開始」を選択します。</li>
            </ol>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">4.3 基準画像を選び直す</h3>
            <p>選択した画像を変更したい場合は、基準画像選択画面に戻り、別の画像を選び直します。</p>
          </section>

          {/* カメラで撮影する */}
          <section className="mt-6 space-y-2">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">5. カメラで撮影する</h2>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">5.1 撮影画面の見方</h3>
            <p>撮影画面では、カメラ映像の上に基準画像が半透明で表示されます。</p>
            <p>主な操作:</p>
            <ul className="list-disc space-y-0.5 pl-5">
              <li>ゴースト濃度の調整</li>
              <li>グリッド表示の切り替え</li>
              <li>三分割ガイドの切り替え</li>
              <li>斜め線ガイドの切り替え</li>
              <li>カメラの前面・背面切り替え</li>
              <li>シャッター撮影</li>
              <li>戻る</li>
            </ul>

            <h3 id="ghost-and-guides" className="mt-3 text-xs font-bold text-[#1B3A5C] scroll-mt-20 dark:text-slate-200">5.2 ゴースト表示を使う</h3>
            <p>ゴースト表示は、基準画像を半透明で重ねる機能です。</p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>画面上の基準画像を見ながら、被写体の位置を合わせます。</li>
              <li>ゴースト濃度スライダーで見やすい濃さに調整します。</li>
              <li>輪郭や目印が重なる位置で撮影します。</li>
            </ol>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">5.3 ガイド線を使う</h3>
            <p>構図を合わせやすくするため、必要に応じてガイド線を表示できます。</p>
            <ul className="list-disc space-y-0.5 pl-5">
              <li><strong>グリッド:</strong> 細かい位置合わせに使います。</li>
              <li><strong>三分割:</strong> 人物や商品をバランスよく配置したいときに使います。</li>
              <li><strong>斜め線:</strong> 角度や傾きを合わせたいときに使います。</li>
            </ul>
            <p>複数のガイドを同時に表示できます。</p>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">5.4 カメラを切り替える</h3>
            <p>前面カメラと背面カメラを切り替えたい場合は、カメラ切替ボタンを選択します。</p>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">5.5 写真を撮影する</h3>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>基準画像と被写体の位置を合わせます。</li>
              <li>必要に応じてゴースト濃度やガイド線を調整します。</li>
              <li>シャッターボタンを選択します。</li>
              <li>出力画面で撮影結果を確認します。</li>
            </ol>
          </section>

          {/* 撮影後の確認と加工 */}
          <section className="mt-6 space-y-2">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">6. 撮影後の確認と加工</h2>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">6.1 出力画面の見方</h3>
            <p>出力画面では、撮影した画像を確認し、必要に応じて加工や保存方法を選択します。</p>
            <p>主な操作:</p>
            <ul className="list-disc space-y-0.5 pl-5">
              <li>撮影画像の確認</li>
              <li>基準画像の確認</li>
              <li>基準画像のモザイク加工</li>
              <li>撮影画像のモザイク加工</li>
              <li>撮影画像のみ保存</li>
              <li>左右比較で保存</li>
              <li>上下比較で保存</li>
              <li>撮り直し</li>
              <li>基準画像を選び直す</li>
            </ul>

            <h3 id="mosaic" className="mt-3 text-xs font-bold text-[#1B3A5C] scroll-mt-20 dark:text-slate-200">6.2 モザイク加工をする</h3>
            <p>顔、個人情報、背景の一部などを隠したい場合は、手動モザイク加工を使います。</p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>「基準画像をモザイク加工」または「撮影画像をモザイク加工」を選択します。</li>
              <li>隠したい部分を指やマウスでなぞります。</li>
              <li>加工後の画像を確認します。</li>
              <li>保存または共有へ進みます。</li>
            </ol>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">6.3 撮り直す</h3>
            <p>撮影結果を変更したい場合は「撮り直し」を選択します。</p>
            <p>同じ基準画像を使ったまま、もう一度撮影できます。</p>
          </section>

          {/* 画像を保存・共有する */}
          <section id="save-images" className="mt-6 space-y-2 scroll-mt-20">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">7. 画像を保存・共有する</h2>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">7.1 撮影画像のみ保存する</h3>
            <p>撮影した写真だけを保存したい場合に使います。</p>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>出力画面で「撮影画像のみ保存」を選択します。</li>
              <li>端末の保存または共有画面で操作を完了します。</li>
            </ol>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">7.2 左右比較で保存する</h3>
            <p>基準画像と撮影画像を横に並べた1枚の画像として保存します。</p>
            <ul className="list-disc space-y-0.5 pl-5">
              <li>左: 基準画像</li>
              <li>右: 撮影画像</li>
            </ul>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">7.3 上下比較で保存する</h3>
            <p>基準画像と撮影画像を縦に並べた1枚の画像として保存します。</p>
            <ul className="list-disc space-y-0.5 pl-5">
              <li>上: 基準画像</li>
              <li>下: 撮影画像</li>
            </ul>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">7.4 保存後の注意</h3>
            <p>ぴたカメは、画像をアプリ内に長期保存しません。</p>
            <p>保存が完了したことを端末の写真アプリや共有先で確認してください。</p>
          </section>

          {/* 解約する */}
          <section id="cancel" className="mt-6 space-y-2 scroll-mt-20">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">8. 解約する</h2>

            <h3 className="mt-3 text-xs font-bold text-[#1B3A5C] dark:text-slate-200">8.1 解約手続きへ進む</h3>
            <ol className="list-decimal space-y-0.5 pl-5">
              <li>ぴたカメにログインします。</li>
              <li>ホーム画面から「利用規約」を開きます。</li>
              <li>「解約手続きへ進む」を選択します。</li>
              <li>Stripeの支払い管理画面で解約手続きを完了します。</li>
            </ol>
          </section>

          {/* 活用方法 */}
          <section id="usecases-and-tips" className="mt-6 space-y-2 scroll-mt-20">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">9. 活用方法</h2>

            <div className="mt-3 rounded-[14px] border border-[#A8DDE5]/40 bg-[#F0FBF8]/60 p-3 dark:border-cyan-300/20 dark:bg-cyan-500/10">
              <h3 className="text-xs font-bold text-[#1B3A5C] dark:text-slate-200">9.1 美容サロンでの施術前後</h3>
              <p className="mt-1">同じ角度・距離・明るさで撮影すると、変化が伝わりやすくなります。</p>
              <p className="mt-1.5 font-semibold text-[#3DC4A8] dark:text-cyan-300">おすすめ:</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                <li>立ち位置を固定する</li>
                <li>背景を毎回同じにする</li>
                <li>顔や個人情報は必要に応じてモザイク加工する</li>
              </ul>
            </div>

            <div className="mt-3 rounded-[14px] border border-[#A8DDE5]/40 bg-[#F0FBF8]/60 p-3 dark:border-cyan-300/20 dark:bg-cyan-500/10">
              <h3 className="text-xs font-bold text-[#1B3A5C] dark:text-slate-200">9.2 姿勢・体型の記録</h3>
              <p className="mt-1">前回画像を基準にして、立ち位置や体の向きを合わせて撮影します。</p>
              <p className="mt-1.5 font-semibold text-[#3DC4A8] dark:text-cyan-300">おすすめ:</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                <li>足元の位置を決めておく</li>
                <li>カメラの高さを固定する</li>
                <li>三分割ガイドやグリッドを使う</li>
              </ul>
            </div>

            <div className="mt-3 rounded-[14px] border border-[#A8DDE5]/40 bg-[#F0FBF8]/60 p-3 dark:border-cyan-300/20 dark:bg-cyan-500/10">
              <h3 className="text-xs font-bold text-[#1B3A5C] dark:text-slate-200">9.3 商品・作品撮影</h3>
              <p className="mt-1">前回の商品写真や見本画像を基準にすると、毎回同じ構図で撮影できます。</p>
              <p className="mt-1.5 font-semibold text-[#3DC4A8] dark:text-cyan-300">おすすめ:</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                <li>商品の中心位置を合わせる</li>
                <li>机や背景を固定する</li>
                <li>斜め線ガイドで角度を合わせる</li>
              </ul>
            </div>

            <div className="mt-3 rounded-[14px] border border-[#A8DDE5]/40 bg-[#F0FBF8]/60 p-3 dark:border-cyan-300/20 dark:bg-cyan-500/10">
              <h3 className="text-xs font-bold text-[#1B3A5C] dark:text-slate-200">9.4 作業前後・清掃前後の記録</h3>
              <p className="mt-1">作業前の画像を基準にして、作業後の状態を同じ構図で撮影します。</p>
              <p className="mt-1.5 font-semibold text-[#3DC4A8] dark:text-cyan-300">おすすめ:</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                <li>部屋の角や柱など、動かない目印を基準にする</li>
                <li>画面の端に入る範囲を毎回そろえる</li>
                <li>比較画像として保存する</li>
              </ul>
            </div>

            <div className="mt-3 rounded-[14px] border border-[#A8DDE5]/40 bg-[#F0FBF8]/60 p-3 dark:border-cyan-300/20 dark:bg-cyan-500/10">
              <h3 className="text-xs font-bold text-[#1B3A5C] dark:text-slate-200">9.5 成長記録</h3>
              <p className="mt-1">子ども、ペット、植物などの成長を、毎回同じ構図で残したいときに使えます。</p>
              <p className="mt-1.5 font-semibold text-[#3DC4A8] dark:text-cyan-300">使い方:</p>
              <ol className="mt-0.5 list-decimal space-y-0.5 pl-5">
                <li>前回撮影した写真を基準画像として選びます。</li>
                <li>身長計、壁、植木鉢、家具など、動かない目印に合わせます。</li>
                <li>ゴースト表示の輪郭に合わせて、今回の写真を撮影します。</li>
                <li>左右比較または上下比較で保存します。</li>
              </ol>
              <p className="mt-1.5 font-semibold text-[#3DC4A8] dark:text-cyan-300">おすすめ:</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                <li>撮影する場所を毎回同じにする</li>
                <li>カメラの高さを決めておく</li>
                <li>月1回、週1回など撮影タイミングを決めておく</li>
                <li>日付やメモは、保存後に端末の写真アプリ側で管理する</li>
              </ul>
            </div>

            <div className="mt-3 rounded-[14px] border border-[#A8DDE5]/40 bg-[#F0FBF8]/60 p-3 dark:border-cyan-300/20 dark:bg-cyan-500/10">
              <h3 className="text-xs font-bold text-[#1B3A5C] dark:text-slate-200">9.6 商品撮影</h3>
              <p className="mt-1">フリマアプリ、ネットショップ、SNS投稿用の商品写真を、毎回同じ見た目で撮りたいときに使えます。</p>
              <p className="mt-1.5 font-semibold text-[#3DC4A8] dark:text-cyan-300">使い方:</p>
              <ol className="mt-0.5 list-decimal space-y-0.5 pl-5">
                <li>きれいに撮れた商品写真を基準画像として選びます。</li>
                <li>商品の中心位置、大きさ、角度をゴースト表示に合わせます。</li>
                <li>グリッドや三分割ガイドで水平・余白を確認します。</li>
                <li>撮影画像のみ保存します。</li>
              </ol>
              <p className="mt-1.5 font-semibold text-[#3DC4A8] dark:text-cyan-300">おすすめ:</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                <li>背景紙や撮影台を固定する</li>
                <li>商品の影が強く出すぎない場所で撮る</li>
                <li>似た商品を連続で撮るときは、同じ基準画像を使う</li>
                <li>ブランドロゴや個人情報が写る場合はモザイク加工する</li>
              </ul>
            </div>

            <div className="mt-3 rounded-[14px] border border-[#A8DDE5]/40 bg-[#F0FBF8]/60 p-3 dark:border-cyan-300/20 dark:bg-cyan-500/10">
              <h3 className="text-xs font-bold text-[#1B3A5C] dark:text-slate-200">9.7 作業記録</h3>
              <p className="mt-1">掃除、修理、片付け、DIY、現場確認など、作業前後の状態をわかりやすく残したいときに使えます。</p>
              <p className="mt-1.5 font-semibold text-[#3DC4A8] dark:text-cyan-300">使い方:</p>
              <ol className="mt-0.5 list-decimal space-y-0.5 pl-5">
                <li>作業前の写真を基準画像として選びます。</li>
                <li>壁の角、窓、床の線、棚など、動かない目印を合わせます。</li>
                <li>作業後の状態を撮影します。</li>
                <li>比較画像として保存し、報告や記録に使います。</li>
              </ol>
              <p className="mt-1.5 font-semibold text-[#3DC4A8] dark:text-cyan-300">おすすめ:</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                <li>撮影位置をテープや目印で決めておく</li>
                <li>広い範囲を撮る場合は、斜め線ガイドで傾きを確認する</li>
                <li>報告用には左右比較、記録用には上下比較を使い分ける</li>
                <li>住所、車のナンバー、個人情報が写る場合はモザイク加工する</li>
              </ul>
            </div>
          </section>

          {/* よくある質問 */}
          <section className="mt-6 space-y-2">
            <h2 className="text-sm font-black text-[#3DC4A8] dark:text-cyan-300">10. よくある質問</h2>

            <div className="mt-3 space-y-2.5">
              <div className="rounded-[12px] border border-[#A8DDE5]/40 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/40">
                <p className="text-xs font-bold text-[#1B3A5C] dark:text-slate-100">Q. 撮影した写真はアプリ内に保存されますか？</p>
                <p className="mt-1 text-[#5B7689] dark:text-slate-400">A. 保存されません。撮影後に端末へ保存または共有してください。</p>
              </div>
              <div className="rounded-[12px] border border-[#A8DDE5]/40 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/40">
                <p className="text-xs font-bold text-[#1B3A5C] dark:text-slate-100">Q. 基準画像はアプリに残りますか？</p>
                <p className="mt-1 text-[#5B7689] dark:text-slate-400">A. 残りません。撮影中と出力時だけ一時的に使用します。</p>
              </div>
              <div className="rounded-[12px] border border-[#A8DDE5]/40 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/40">
                <p className="text-xs font-bold text-[#1B3A5C] dark:text-slate-100">Q. PINを忘れた場合はどうすればよいですか？</p>
                <p className="mt-1 text-[#5B7689] dark:text-slate-400">A. ログイン画面の「PINを忘れた場合」から、登録メールアドレスと新しい4桁PINを入力して更新してください。</p>
              </div>
              <div className="rounded-[12px] border border-[#A8DDE5]/40 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/40">
                <p className="text-xs font-bold text-[#1B3A5C] dark:text-slate-100">Q. カメラが起動しない場合はどうすればよいですか？</p>
                <p className="mt-1 text-[#5B7689] dark:text-slate-400">A. 端末やブラウザのカメラ許可を確認してください。許可後も起動しない場合は、ブラウザを再起動してください。</p>
              </div>
              <div className="rounded-[12px] border border-[#A8DDE5]/40 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-900/40">
                <p className="text-xs font-bold text-[#1B3A5C] dark:text-slate-100">Q. 画像を保存できない場合はどうすればよいですか？</p>
                <p className="mt-1 text-[#5B7689] dark:text-slate-400">A. 端末の保存権限、空き容量、ブラウザの共有設定を確認してください。</p>
              </div>
            </div>
          </section>

          {/* トップへ戻るボタン */}
          <div className="mt-7 flex justify-center">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1.5 rounded-[10px] border border-[#A8DDE5] bg-white px-4 py-2 text-xs font-semibold text-[#3DC4A8] transition-all hover:bg-[#F0FBF8] active:scale-[0.99] dark:border-cyan-300/20 dark:bg-slate-900/45 dark:text-cyan-300"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              ページ上部へ戻る
            </button>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}
