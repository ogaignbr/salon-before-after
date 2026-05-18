import { useNavigate } from 'react-router-dom';
import { AppFrame, AppHeader } from '../components/AppFrame';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <AppFrame>
      <AppHeader title="プライバシーポリシー" onBack={() => navigate(-1)} backLabel="戻る" />

      <div className="flex-1 overflow-y-auto px-1 pb-2">
        <div className="rounded-[16px] border border-white/65 bg-white/75 p-5 text-[11px] leading-relaxed text-slate-600 shadow-[0_18px_36px_-28px_rgba(68,82,147,0.75)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:text-slate-300 dark:shadow-[0_20px_42px_-30px_rgba(30,46,105,0.9)]">

          <p className="text-[10px] text-slate-400 dark:text-slate-500">最終更新日: 2025年7月1日</p>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-indigo-500 dark:text-indigo-300">1. はじめに</h2>
            <p>
              ぴたカメ（以下「本アプリ」）は、美容サロン・エステサロン等における施術前後の比較写真撮影を支援するアプリケーションです。
              本アプリの提供者（以下「当社」）は、お客様およびサロン利用者の個人情報の保護を重要な責務と考え、
              以下のとおりプライバシーポリシーを定めます。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-indigo-500 dark:text-indigo-300">2. 収集する情報</h2>
            <p>本アプリでは以下の情報を取得・保存します。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>お客様のお名前（サロンスタッフが入力）</li>
              <li>施術前後の写真（カメラで撮影）</li>
              <li>撮影部位の選択情報（顔・体）</li>
              <li>撮影日時</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-indigo-500 dark:text-indigo-300">3. 情報の利用目的</h2>
            <p>収集した情報は、以下の目的にのみ使用します。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>施術前後の比較写真の作成・表示</li>
              <li>撮影履歴の管理・検索</li>
              <li>お客様へのカウンセリング資料としての利用</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-indigo-500 dark:text-indigo-300">4. データの保存場所</h2>
            <p>
              撮影した写真およびお客様情報は、ご利用端末のブラウザ内ストレージ（IndexedDB）に保存されます。
              当社のサーバーに写真データが送信されることはありません。
              データはご利用の端末内にのみ存在します。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-indigo-500 dark:text-indigo-300">5. 第三者提供</h2>
            <p>
              当社は、お客様の同意なく個人情報を第三者に提供することはありません。
              ただし、法令に基づく場合はこの限りではありません。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-indigo-500 dark:text-indigo-300">6. データの削除</h2>
            <p>
              サロンスタッフは、アプリ内の撮影履歴画面からいつでもデータを削除できます。
              また、ブラウザのデータを消去することで、すべてのデータを完全に削除できます。
              お客様からデータ削除の要請があった場合、サロンは速やかに対応するものとします。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-indigo-500 dark:text-indigo-300">7. 安全管理措置</h2>
            <p>
              本アプリは以下の安全管理措置を講じています。
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>データは端末内にのみ保存され、外部サーバーへの送信を行いません</li>
              <li>HTTPS通信によりアプリの配信経路を暗号化しています</li>
              <li>撮影にはお客様の事前同意を取得する仕組みを導入しています</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-indigo-500 dark:text-indigo-300">8. お客様の権利</h2>
            <p>お客様は以下の権利を有します。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>自身のデータの開示を求める権利</li>
              <li>自身のデータの訂正・削除を求める権利</li>
              <li>撮影への同意を撤回する権利</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-indigo-500 dark:text-indigo-300">9. ポリシーの変更</h2>
            <p>
              本ポリシーは、法令の改正やサービス内容の変更に応じて、事前の通知なく改定する場合があります。
              改定後のポリシーは、本アプリ内に掲載した時点から効力を生じるものとします。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-indigo-500 dark:text-indigo-300">10. お問い合わせ</h2>
            <p>
              個人情報の取扱いに関するお問い合わせは、本アプリを提供するサロン、
              または下記の窓口までご連絡ください。
            </p>
            <p className="text-slate-400 dark:text-slate-500">
              ※ 連絡先はアプリ提供元のサロンにお問い合わせください。
            </p>
          </section>

        </div>
      </div>
    </AppFrame>
  );
}
