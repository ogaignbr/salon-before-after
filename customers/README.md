# 顧客一覧（管理用）

このフォルダは `npm run customers` 実行時に作成・更新されます。

- `customers.csv` … Excel等で開ける表形式（UTF-8 BOM付き）
- `customers.json` … プログラム連携用

## 使い方

1. プロジェクトルートに `.env.admin` を作成（`.env.admin.example` 参照）。
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` （Supabase Dashboard > Settings > API）
2. ターミナルで実行:

   ```powershell
   npm run customers
   ```

3. 完了後、このフォルダに `customers.csv` と `customers.json` が出力されます。

## 出力項目

| 項目 | 説明 |
| ---- | ---- |
| 登録日 | アカウント作成日時 |
| ログインID | 4桁の顧客ID |
| メールアドレス | 登録メール |
| 現在の状況 | 無料トライアル中 / 有料利用中 / 支払い遅延 / 解約済み など |
| 無料トライアル終了日 | trial_end |
| 初回有料開始日 | 初めて active に切り替わった日 |
| 次回更新日 | current_period_end |
| 解約日 | 解約手続きが行われた日 |

## 注意

- 個人情報を含むため、出力ファイルはGit管理対象外です（`.gitignore` 済）。
- `service_role` キーは絶対に公開・共有しないでください。
