import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppFrame, AppHeader } from '../components/AppFrame';

export default function TermsPage() {
  const navigate = useNavigate();
  const { user, openCustomerPortal } = useAuth();

  return (
    <AppFrame>
      <AppHeader title="利用規約" onBack={() => navigate(-1)} backLabel="戻る" />

      <div className="flex-1 overflow-y-auto px-1 pb-2">
        <div className="rounded-[20px] border border-[#B9A7FF]/35 bg-[rgba(255,255,255,0.94)] p-5 text-[11px] leading-relaxed text-[#161B5C] shadow-[0_12px_32px_rgba(85,70,180,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:text-slate-300 dark:shadow-[0_20px_42px_-30px_rgba(30,46,105,0.9)]">
          <p className="text-[10px] text-[#6B6F8A] dark:text-slate-500">最終更新日: 2026年5月22日</p>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第1条（適用）</h2>
            <p>
              本規約は、ぴたカメ（以下「本アプリ」）の利用条件を定めるものです。
              本アプリを利用するすべてのユーザー（以下「利用者」）は、本規約に同意したものとみなします。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第2条（サービス内容）</h2>
            <p>
              本アプリは、利用者が選択した画像をカメラ画面に半透明で重ね、同じ画角や構図で新しい写真を撮影しやすくする比較カメラです。
              特定の業種や用途に限定されず、記録、比較、確認、作品撮影、商品撮影、成長記録、作業報告など、利用者の目的に応じて使用できます。
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>端末内の画像を基準画像として選択する機能</li>
              <li>基準画像のゴースト表示と濃度調整</li>
              <li>グリッド、三分割、斜め線などの構図ガイド表示</li>
              <li>撮影画像および基準画像への手動モザイク加工</li>
              <li>撮影画像のみ、または基準画像との比較画像の保存・共有</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第3条（利用者の責任）</h2>
            <p>利用者は、以下の事項を遵守するものとします。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>人物、所有物、作品、施設、商品、書類などを撮影・利用する場合、必要に応じて本人、権利者、管理者等の許可を得ること</li>
              <li>基準画像および撮影画像に含まれる個人情報、機密情報、著作物、商標、肖像等を適切に取り扱うこと</li>
              <li>出力した画像を利用者自身の責任で保存・共有・削除すること</li>
              <li>第三者の権利または利益を侵害する目的で本アプリを使用しないこと</li>
              <li>法令、公序良俗、本規約に反する目的で本アプリを使用しないこと</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第4条（画像データの取扱い）</h2>
            <p>
              本アプリは、基準画像および撮影画像を撮影・編集・出力のために一時的に扱います。
              本アプリは、画像をアプリ内の履歴として長期保存することを前提としていません。
            </p>
            <p>
              利用者は、撮影後に必要な画像を端末へ保存または共有してください。
              端末、ブラウザ、通信環境、OS、外部サービス等の状態により、画像の保存・共有ができない場合があります。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第5条（禁止事項）</h2>
            <p>利用者は以下の行為を行ってはなりません。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>本アプリの不正利用、改ざん、リバースエンジニアリング</li>
              <li>第三者のプライバシー、肖像権、著作権、商標権、所有権その他の権利を侵害する行為</li>
              <li>同意や権限のない画像を撮影、加工、保存、共有、公開する行為</li>
              <li>虚偽、誤認、差別、名誉毀損、迷惑行為、違法行為につながる画像利用</li>
              <li>本アプリの運営を妨害する行為</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第6条（免責事項）</h2>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>当社は、本アプリで撮影・加工・出力された画像の内容、管理、利用、公開、共有に関して責任を負いません。</li>
              <li>当社は、端末の故障、紛失、ブラウザのデータ消去、アプリ更新、通信障害、外部サービスの仕様変更等によるデータの喪失について責任を負いません。</li>
              <li>当社は、本アプリの利用に起因する利用者と第三者との紛争について責任を負いません。</li>
              <li>当社は、本アプリの完全性、正確性、継続性、特定目的への適合性を保証しません。</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第7条（サービスの変更・停止）</h2>
            <p>
              当社は、利用者への事前通知なく、本アプリの内容変更、
              または提供の一時停止・終了を行うことができるものとします。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第8条（規約の変更）</h2>
            <p>
              当社は、必要に応じて本規約を変更できるものとします。
              変更後の規約は、本アプリ内に掲載した時点から効力を生じるものとします。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第9条（準拠法・管轄）</h2>
            <p>
              本規約は日本法に準拠し、本規約に関する紛争については、
              東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

          <section className="mt-5 rounded-[16px] border border-[#B9A7FF]/30 bg-[#F4F2FF]/70 p-4 dark:border-indigo-300/20 dark:bg-indigo-500/10">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第10条（解約について）</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-[#161B5C]/85 dark:text-indigo-100/85">
              サブスクリプションの解約は、お支払い管理画面（Stripeカスタマーポータル）からいつでも行えます。
              解約手続き後は、契約期間終了日まで利用可能です。日割り返金の有無は決済事業者の規約に準じます。
            </p>
            {user ? (
              <button
                onClick={async () => {
                  const result = await openCustomerPortal();
                  if (result.error) alert(result.error);
                }}
                className="sheen-wrap mt-3 w-full rounded-[10px] border border-[#8B5CFF]/40 bg-[linear-gradient(135deg,#6B4CFF_0%,#7B54FF_50%,#8B5CFF_100%)] px-3 py-2.5 text-xs font-bold text-white shadow-[0_8px_18px_rgba(90,65,230,0.24)] transition-all hover:brightness-105 active:scale-[0.99]"
              >
                解約手続きへ進む
              </button>
            ) : (
              <p className="mt-2 text-[10px] text-[#6B4CFF] dark:text-indigo-300">解約はログイン後に行えます。</p>
            )}
          </section>
        </div>
      </div>
    </AppFrame>
  );
}
