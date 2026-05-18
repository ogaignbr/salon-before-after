# ぴたカメ サブスク機能 セットアップ手順

この手順で Supabase（認証・DB）+ Stripe（決済）を設定します。
所要時間: 約1〜2時間

---

## 認証・ログイン仕様（現在の実装）

アプリは **Supabase Auth（メール）** をユーザー識別に使いつつ、日常のログインは **4 桁のログイン ID + 4 桁 PIN** です。

| 項目 | 内容 |
|------|------|
| 新規登録 | メールアドレスのみ入力（`/signup`、または `/login` の「新規登録（無料トライアル）」）。`auth.users` 作成時にトリガーが `member_profiles`（4 桁 `login_id` 自動採番、初期 PIN `0000` のハッシュ、`must_change_pin: true`）と `subscriptions`（`trialing`・試用 7 日）を作成します。 |
| ログイン | Edge Function **`resolve-login-id`** が ID・PIN を受け取り、`member_profiles` の `pin_hash`（SHA-256）と照合してメールを返します。アプリは **`signInWithPassword({ email, password: "PIN-" + pin })`** でセッションを取得します（PIN と Auth のパスワードは常に対応させます）。 |
| 初回 PIN 変更 | DB の `must_change_pin` が true、または PIN が `0000` のままログインした場合は、ホーム等へ進む前に PIN を変更する必要があります。変更時に `member_profiles` と Supabase Auth のパスワードを同期します。 |
| PIN 初期化（管理者） | Edge Function **`reset-pin-admin`** とシークレット **`PIN_RESET_ADMIN_KEY`**。`/login` の「PIN を忘れた方」から ID・初期化後 PIN・キーを入力します。初期化後 PIN が `0000` のときだけ `must_change_pin` が再度 true になります。 |
| 画面ガード | 未ログイン、または PIN 変更必須 → `/login`。サブスクが `expired` / `canceled` / `past_due` / `none` → `/subscribe`。`trialing` または `active` のときのみホーム・撮影などを利用できます。 |

---

## Step 1: Supabase プロジェクト作成

1. https://supabase.com にアクセス → 「Start your project」でアカウント作成
2. 「New Project」をクリック
3. 設定:
   - **Project name**: `pitacame`
   - **Database Password**: 強力なパスワードを設定（メモしておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択
4. 作成後、ダッシュボードで以下をメモ:
   - **Settings > API** にある:
     - `Project URL` → これが `VITE_SUPABASE_URL`
     - `anon public` キー → これが `VITE_SUPABASE_ANON_KEY`
     - `service_role` キー → これは **Edge Function用**（後で使う）

## Step 2: データベースマイグレーション

1. Supabase ダッシュボード → 左メニュー「SQL Editor」
2. リポジトリ内の次のファイルを **この順番で** 開き、**全文**をコピーしてエディタに貼り付け、「Run」を実行します。
   - `supabase/migrations/001_subscriptions.sql`
   - `supabase/migrations/002_member_profiles_and_subscription_policies.sql`
3. それぞれ成功したら OK です。

## Step 3: Supabase 認証設定

1. ダッシュボード → 左メニュー「Authentication」→「Providers」
2. **Email** が有効になっていることを確認（デフォルトで有効）
3. 「Authentication」→「URL Configuration」:
   - **Site URL**: `https://ogaignbr.github.io/salon-before-after/` （本番URL）
   - **Redirect URLs** に追加:
     - `https://ogaignbr.github.io/salon-before-after/`
     - `http://localhost:5173/` （開発用）

## Step 4: Stripe アカウント作成 & 商品登録

1. https://stripe.com/jp にアクセス → アカウント作成
2. ダッシュボード → 左メニュー「商品カタログ」→「商品を追加」
3. 商品設定:
   - **商品名**: `ぴたカメ 月額プラン`
   - **説明**: `サロン向けビフォーアフター撮影アプリ`
   - **価格**: `980円` / `月次（毎月）`
4. 保存

## Step 5: Stripe Price ID を確認

1. Stripe ダッシュボード → 商品 → 価格（980円/月）を開く
2. `price_...` で始まる Price ID を控える
3. これを `VITE_STRIPE_PRICE_ID` に設定

## Step 6: Stripe Webhook 設定（Edge Function）

### 6-1: Supabase CLI インストール

```bash
npm install -g supabase
```

### 6-2: Edge Function をデプロイ

プロジェクトのルートで:

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

`<your-project-ref>` は Supabase ダッシュボード → Settings → General の「Reference ID」

```bash
supabase functions deploy create-checkout-session --no-verify-jwt
supabase functions deploy resolve-login-id --no-verify-jwt
supabase functions deploy reset-pin-admin --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```

### 6-3: Edge Function に環境変数を設定

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
supabase secrets set PIN_RESET_ADMIN_KEY=<管理者初期化キー>
```

※ `STRIPE_SECRET_KEY` は Stripe ダッシュボード → 開発者 → APIキー → シークレットキー
※ `STRIPE_WEBHOOK_SECRET` は次のステップで取得

### 6-4: Stripe 側に Webhook エンドポイントを登録

1. Stripe ダッシュボード → 開発者 → Webhook
2. 「エンドポイントを追加」
3. **URL**: `https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook`
4. **イベント** を選択:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. 作成後に表示される **署名シークレット**（`whsec_...`）をコピー
6. Step 6-3 の `STRIPE_WEBHOOK_SECRET` にこの値を設定

## Step 7: 環境変数をアプリに設定

プロジェクトルートに `.env` ファイルを作成:

```
VITE_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PRICE_ID=price_xxxxxxxxxxxxxxxx
```

## Step 8: GitHub Actions の環境変数

GitHub Pages でデプロイする場合:

1. GitHub リポジトリ → Settings → Secrets and variables → Actions
2. 以下を **Repository secrets** に追加します（アプリの `SubscribePage` が Stripe Checkout 用に参照します）。
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PRICE_ID`（`price_...`。以前の `VITE_STRIPE_PAYMENT_LINK` は使用していません）

3. `.github/workflows/deploy-pages.yml` のビルドでは、次の環境変数が渡されます（ファイル側で既に設定済みです）。

```yaml
- run: npm run build
  env:
    GITHUB_PAGES: 'true'
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    VITE_STRIPE_PRICE_ID: ${{ secrets.VITE_STRIPE_PRICE_ID }}
```

## Step 9: 動作確認

### テスト手順

1. `npm run dev` でローカル起動
2. `/signup`、または `/login` の「新規登録（無料トライアル）」でメール登録 → **4 桁 ID** と初期 PIN `0000` を確認
3. `/login` で **ID + `0000`** でログイン → **PIN 変更**（初回は `must_change_pin` または PIN `0000` のため必須）
4. PIN 変更後にホームへ進めることを確認
5. トライアル中バナー表示を確認
6. DB で `trial_end` を過去にすると `/subscribe` へリダイレクトされることを確認
7. 「月額980円で申し込む」→ Stripe Checkout でテストカード（`4242 4242 4242 4242`）で支払い
8. アプリに戻り「お支払い済みの方はここをタップ」→ `active` 反映を確認
9. （任意）Edge Function `resolve-login-id` / `reset-pin-admin` がデプロイ済みであること、`PIN_RESET_ADMIN_KEY` を設定済みであることを確認して PIN 初期化を試す

### Stripe テストモード

Stripe はデフォルトで**テストモード**です。本番公開前にテストモードで全フロー確認してから、
ダッシュボードで「本番モードを有効にする」→ キー類を本番用に差し替えてください。

---

## フロー図（まとめ）

```
ユーザー              アプリ              Edge Fn / Supabase Auth       DB / Stripe
   │                    │                          │                      │
   │─ メールで新規登録 ─→│─ signUp ───────────────→│ auth.users 作成      │
   │                    │                          │─ トリガー ─────────→│ profiles + subscription(trialing)
   │← 4桁ID・PIN0000 ───│                          │                      │
   │                    │                          │                      │
   │─ ID+PIN でログイン ─→│─ resolve-login-id ───────→│ pin_hash 照合→email   │
   │                    │─ signInWithPassword ─────→│ パスワード PIN-{pin} │
   │                    │─ fetch profile/sub ───────→│                      │
   │← ホーム or PIN変更 ─│                          │                      │
   │                    │                          │                      │
   │  (試用終了など)     │─ AuthGuard ──────────────→│ subscription NG      │
   │← /subscribe ───────│                          │                      │
   │─ 申し込む ─────────→│─ create-checkout-session ─────────────────────→│ Stripe Checkout
   │                    │                          │← webhook ───────────→│ active 更新
   │─ 「支払い済み」 ───→│─ refresh subscription ────→│                      │
```
