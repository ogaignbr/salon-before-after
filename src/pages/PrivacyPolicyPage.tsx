import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
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
        <h1 className="flex-1 text-center font-black text-pink-500 text-sm">プライバシーポリシー</h1>
        <div className="w-14" />
      </div>

      <div className="flex-1 px-5 py-6">
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-5 text-[11px] leading-relaxed text-gray-600 space-y-4">

          <p className="text-[10px] text-gray-400">最終更新日: 2025年7月1日</p>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">1. はじめに</h2>
            <p>
              ぴたカメ（以下「本アプリ」）は、美容サロン・エステサロン等における施術前後の比較写真撮影を支援するアプリケーションです。
              本アプリの提供者（以下「当社」）は、お客様およびサロン利用者の個人情報の保護を重要な責務と考え、
              以下のとおりプライバシーポリシーを定めます。
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">2. 収集する情報</h2>
            <p>本アプリでは以下の情報を取得・保存します。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>お客様のお名前（サロンスタッフが入力）</li>
              <li>施術前後の写真（カメラで撮影）</li>
              <li>撮影部位の選択情報（顔・体）</li>
              <li>撮影日時</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">3. 情報の利用目的</h2>
            <p>収集した情報は、以下の目的にのみ使用します。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>施術前後の比較写真の作成・表示</li>
              <li>撮影履歴の管理・検索</li>
              <li>お客様へのカウンセリング資料としての利用</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">4. データの保存場所</h2>
            <p>
              撮影した写真およびお客様情報は、ご利用端末のブラウザ内ストレージ（IndexedDB）に保存されます。
              当社のサーバーに写真データが送信されることはありません。
              データはご利用の端末内にのみ存在します。
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">5. 第三者提供</h2>
            <p>
              当社は、お客様の同意なく個人情報を第三者に提供することはありません。
              ただし、法令に基づく場合はこの限りではありません。
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">6. データの削除</h2>
            <p>
              サロンスタッフは、アプリ内の撮影履歴画面からいつでもデータを削除できます。
              また、ブラウザのデータを消去することで、すべてのデータを完全に削除できます。
              お客様からデータ削除の要請があった場合、サロンは速やかに対応するものとします。
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">7. 安全管理措置</h2>
            <p>
              本アプリは以下の安全管理措置を講じています。
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>データは端末内にのみ保存され、外部サーバーへの送信を行いません</li>
              <li>HTTPS通信によりアプリの配信経路を暗号化しています</li>
              <li>撮影にはお客様の事前同意を取得する仕組みを導入しています</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">8. お客様の権利</h2>
            <p>お客様は以下の権利を有します。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>自身のデータの開示を求める権利</li>
              <li>自身のデータの訂正・削除を求める権利</li>
              <li>撮影への同意を撤回する権利</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">9. ポリシーの変更</h2>
            <p>
              本ポリシーは、法令の改正やサービス内容の変更に応じて、事前の通知なく改定する場合があります。
              改定後のポリシーは、本アプリ内に掲載した時点から効力を生じるものとします。
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="font-black text-pink-500 text-xs">10. お問い合わせ</h2>
            <p>
              個人情報の取扱いに関するお問い合わせは、本アプリを提供するサロン、
              または下記の窓口までご連絡ください。
            </p>
            <p className="text-gray-400">
              ※ 連絡先はアプリ提供元のサロンにお問い合わせください。
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
