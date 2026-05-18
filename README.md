# ぴたカメ（salon-before-after）

サロン向けのビフォーアフター撮影 Web アプリです。React（Vite）+ TypeScript、バックエンドは Supabase（認証・DB・Edge Functions）、課金は Stripe と連携しています。

## 主な機能

- 4 桁のログイン ID と 4 桁 PIN でログイン（日常のログインではメールアドレスは使いません）
- 新規登録時はメールアドレスのみ入力 → 自動で 4 桁 ID が発行され、初期 PIN は `0000`
- トライアル・サブスク状態に応じた画面ガードと Stripe Checkout による課金

## ドキュメント

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** — Supabase / Stripe / GitHub Pages のセットアップと環境変数

## 開発

```bash
npm ci
npm run dev
```

ルートパスは GitHub Pages 利用時、`vite.config` の `base` に合わせて調整されています。

## ライセンス

リポジトリ内のライセンス表記に従ってください。
