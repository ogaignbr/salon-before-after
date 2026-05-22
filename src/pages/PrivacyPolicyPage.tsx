import { useNavigate } from 'react-router-dom';
import { AppFrame, AppHeader } from '../components/AppFrame';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <AppFrame>
      <AppHeader title="プライバシーポリシー" onBack={() => navigate(-1)} backLabel="戻る" />

      <div className="flex-1 overflow-y-auto px-1 pb-2">
        <div className="rounded-[20px] border border-[#B9A7FF]/35 bg-[rgba(255,255,255,0.94)] p-5 text-[11px] leading-relaxed text-[#161B5C] shadow-[0_12px_32px_rgba(85,70,180,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45 dark:text-slate-300 dark:shadow-[0_20px_42px_-30px_rgba(30,46,105,0.9)]">

          <p className="text-[10px] text-[#6B6F8A] dark:text-slate-500">最終更新日: 2026年5月22日</p>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">1. はじめに</h2>
            <p>
              ぴたカメ（以下「本アプリ」）は、利用者が選択した画像をカメラ画面に半透明で重ね、同じ画角や構図で新しい写真を撮影しやすくする比較カメラです。
              特定の業種や用途に限定されず、記録、比較、確認、作品撮影、商品撮影、成長記録、作業報告など、利用者の目的に応じて使用できます。
            </p>
            <p>
              本アプリの提供者（以下「当社」）は、利用者のプライバシーと画像データの取扱いを重要な事項と考え、以下のとおりプライバシーポリシーを定めます。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">2. 取得する情報</h2>
            <p>本アプリでは、利用状況に応じて以下の情報を取り扱います。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>アカウント登録・ログインに使用するメールアドレス</li>
              <li>サブスクリプション管理に必要な決済関連情報（決済事業者であるStripeを通じて処理されます）</li>
              <li>利用者が端末から選択する基準画像</li>
              <li>カメラで撮影する画像</li>
              <li>手動モザイク加工など、出力前の編集内容</li>
              <li>カメラ、画像ファイル、ブラウザ共有機能など、端末側の機能利用に必要な権限情報</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">3. 情報の利用目的</h2>
            <p>取得または取り扱う情報は、以下の目的に使用します。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>本アプリのログイン、本人確認、サブスクリプション管理</li>
              <li>選択した基準画像を撮影画面にゴースト表示するため</li>
              <li>撮影画像の確認、モザイク加工、比較画像の生成、保存・共有を行うため</li>
              <li>本アプリの提供、保守、改善、不具合対応のため</li>
              <li>利用規約違反、不正利用、法令違反への対応のため</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">4. 画像データの保存と送信</h2>
            <p>
              本アプリは、基準画像および撮影画像を撮影・編集・出力のために一時的に取り扱います。
              本アプリは、画像をアプリ内の履歴として長期保存することを前提としていません。
            </p>
            <p>
              基準画像や撮影画像は、原則として利用者の端末およびブラウザ上で処理されます。
              当社は、利用者が選択・撮影した画像を、画像管理を目的として当社サーバーへ保存しません。
            </p>
            <p>
              利用者が端末の保存機能、共有機能、外部アプリ、クラウドサービス、SNS等を利用した場合、画像は利用者の操作により当該サービスへ送信または保存されることがあります。
              その場合の取扱いは、各サービスの規約およびプライバシーポリシーに従います。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">5. 第三者提供・外部サービス</h2>
            <p>
              当社は、法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供しません。
            </p>
            <p>
              アカウント管理、認証、決済、ホスティング等のために、Supabase、Stripe、GitHub Pages等の外部サービスを利用する場合があります。
              これらのサービスには、サービス提供に必要な範囲で情報が送信されることがあります。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">6. 利用者による画像管理</h2>
            <p>
              本アプリは、撮影後に必要な画像を利用者自身が端末へ保存または共有する使い方を前提としています。
              出力した画像の保存、共有、公開、削除、バックアップは利用者の責任で行ってください。
            </p>
            <p>
              人物、所有物、作品、施設、商品、書類などが写る画像を扱う場合は、必要に応じて本人、権利者、管理者等の許可を得てください。
              個人情報や機密情報が含まれる場合は、モザイク加工等を活用し、適切に管理してください。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">7. 安全管理措置</h2>
            <p>本アプリは以下の安全管理措置に努めます。</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>HTTPS通信によりアプリの配信経路を暗号化すること</li>
              <li>画像をアプリ内履歴として長期保存しない設計とすること</li>
              <li>出力前に手動モザイク加工を行える機能を提供すること</li>
              <li>認証・決済等の外部サービスについて、必要な範囲で適切なサービスを利用すること</li>
            </ul>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">8. 利用者の権利</h2>
            <p>
              利用者は、法令に基づき、当社が保有する自身の個人情報について、開示、訂正、削除、利用停止等を求めることができます。
              画像データについては、利用者の端末または利用者が保存・共有した外部サービス上で管理されるため、利用者自身で削除・管理してください。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">9. ポリシーの変更</h2>
            <p>
              本ポリシーは、法令の改正やサービス内容の変更に応じて、事前の通知なく改定する場合があります。
              改定後のポリシーは、本アプリ内に掲載した時点から効力を生じるものとします。
            </p>
          </section>

          <section className="mt-4 space-y-1.5">
            <h2 className="text-xs font-black text-[#6B4CFF] dark:text-indigo-300">10. お問い合わせ</h2>
            <p>
              個人情報の取扱いに関するお問い合わせは、本アプリの提供元または運営者までご連絡ください。
            </p>
            <p className="text-[#6B6F8A] dark:text-slate-500">
              ※ 具体的な連絡先は、提供元が案内する窓口をご確認ください。
            </p>
          </section>

        </div>
      </div>
    </AppFrame>
  );
}
