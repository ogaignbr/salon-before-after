import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-pink-100 via-pink-50 to-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-white/70 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-pink-400 font-bold text-sm flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          もどる
        </button>
        <h1 className="flex-1 text-center font-black text-pink-500 text-sm">利用規約</h1>
        <div className="w-14" />
      </div>

      <div className="flex-1 px-5 py-6">
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 text-[11px] leading-relaxed text-gray-600 space-y-4">

          <p className="text-[10px] text-gray-400">最終更新日: 2025年7月1日</p>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">第1条（適用）</h2>
            <p>
              本規約は、ぴたカメ（以下「本アプリ」）の利用に関する条件を定めるものです。
              本アプリを利用するすべてのユーザー（以下「利用者」）は、本規約に同意したものとみなします。
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">第2条（サービス内容）</h2>
            <p>本アプリは以下の機能を提供します。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>施術前後の写真撮影（ビフォー・アフター）</li>
              <li>撮影写真のガイド重ね合わせ機能</li>
              <li>写真の比較表示・書き出し</li>
              <li>モザイク加工機能</li>
              <li>撮影履歴の管理</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">第3条（利用者の責任）</h2>
            <p>利用者は、以下の事項を遵守するものとします。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>撮影前に必ずお客様の同意を得ること</li>
              <li>撮影データを適切に管理し、不正アクセスや漏洩を防止すること</li>
              <li>お客様からデータ削除の要請があった場合、速やかに対応すること</li>
              <li>撮影データをお客様の同意なく第三者に提供しないこと</li>
              <li>本アプリを法令に違反する目的で使用しないこと</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">第4条（撮影データの取扱い）</h2>
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

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">第5条（禁止事項）</h2>
            <p>利用者は以下の行為を行ってはなりません。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>本アプリの不正利用・リバースエンジニアリング</li>
              <li>他者の権利を侵害する行為</li>
              <li>お客様の同意なく撮影データをSNS等に公開する行為</li>
              <li>本アプリを用いた公序良俗に反する行為</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">第6条（免責事項）</h2>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>当社は、端末の故障・紛失・ブラウザのデータ消去等によるデータの喪失について責任を負いません。</li>
              <li>当社は、本アプリの利用に起因するサロンとお客様間のトラブルについて責任を負いません。</li>
              <li>当社は、本アプリの動作保証および特定目的への適合性を保証しません。</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">第7条（サービスの変更・停止）</h2>
            <p>
              当社は、利用者への事前通知なく、本アプリの内容変更、
              または提供の一時停止・終了を行うことができるものとします。
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">第8条（規約の変更）</h2>
            <p>
              当社は、必要に応じて本規約を変更できるものとします。
              変更後の規約は、本アプリ内に掲載した時点から効力を生じるものとします。
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">第9条（準拠法・管轄）</h2>
            <p>
              本規約は日本法に準拠し、本規約に関する紛争については、
              東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
