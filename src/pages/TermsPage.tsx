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
          <p className="text-[10px] text-[#6B6F8A] dark:text-slate-500">最終更新日: 2026年5月19日</p>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第1条（適用）</h2>
            <p>
              本規約は、ぴたカメ（以下「本アプリ」）の利用に関する条件を定めるものです。
              本アプリを利用するすべてのユーザー（以下「利用者」）は、本規約に同意したものとみなします。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第2条（サービス内容）</h2>
            <p>本アプリは以下の機能を提供します。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>施術前後の写真撮影（ビフォー・アフター）</li>
              <li>撮影写真のガイド重ね合わせ機能</li>
              <li>写真の比較表示・書き出し</li>
              <li>モザイク加工機能</li>
              <li>撮影履歴の管理</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第3条（利用者の責任）</h2>
            <p>利用者は、以下の事項を遵守するものとします。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>撮影前に必ずお客様の同意を得ること</li>
              <li>撮影データを適切に管理し、不正アクセスや漏洩を防止すること</li>
              <li>お客様からデータ削除の要請があった場合、速やかに対応すること</li>
              <li>撮影データをお客様の同意なく第三者に提供しないこと</li>
              <li>本アプリを法令に違反する目的で使用しないこと</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第4条（撮影データの取扱い）</h2>
            <p>
              撮影データは利用者の端末内に保存されます。
              当社は撮影データへのアクセス権を有しません。
              データの管理責任は利用者（サロン）に帰属します。
            </p>
            <p>
              利用者は、個人情報保護法その他の関連法令を遵守し、
              お客様の個人情報を適切に取り扱う義務を負います。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第5条（禁止事項）</h2>
            <p>利用者は以下の行為を行ってはなりません。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>本アプリの不正利用・リバースエンジニアリング</li>
              <li>他者の権利を侵害する行為</li>
              <li>お客様の同意なく撮影データをSNS等に公開する行為</li>
              <li>本アプリを用いた公序良俗に反する行為</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">第6条（免責事項）</h2>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>当社は、端末の故障・紛失・ブラウザのデータ消去等によるデータの喪失について責任を負いません。</li>
              <li>当社は、本アプリの利用に起因するサロンとお客様間のトラブルについて責任を負いません。</li>
              <li>当社は、本アプリの動作保証および特定目的への適合性を保証しません。</li>
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
