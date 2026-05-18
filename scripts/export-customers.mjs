#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { config as loadEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

loadEnv({ path: resolve(projectRoot, '.env') });
loadEnv({ path: resolve(projectRoot, '.env.admin'), override: true });

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を .env.admin に設定してください。');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const statusLabels = {
  trialing: '無料トライアル中',
  active: '有料利用中',
  past_due: '支払い遅延',
  canceled: '解約済み',
  expired: '期限切れ',
  none: '未登録',
};

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('ja-JP', { hour12: false });
  } catch {
    return String(value);
  }
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const { data, error } = await supabase
  .from('customer_directory')
  .select('*')
  .order('registered_at', { ascending: false });

if (error) {
  console.error('Supabaseからの取得に失敗しました:', error.message);
  process.exit(1);
}

const rows = data ?? [];

const headers = [
  '登録日',
  'ログインID',
  'メールアドレス',
  '現在の状況',
  '無料トライアル終了日',
  '初回有料開始日',
  '次回更新日',
  '解約日',
  'StripeカスタマーID',
  'StripeサブスクリプションID',
];

const records = rows.map((row) => ({
  registered_at: row.registered_at,
  login_id: row.login_id,
  email: row.email,
  status_label: statusLabels[row.status] ?? row.status ?? '未登録',
  trial_end: row.trial_end,
  activated_at: row.activated_at,
  current_period_end: row.current_period_end,
  canceled_at: row.canceled_at,
  stripe_customer_id: row.stripe_customer_id,
  stripe_subscription_id: row.stripe_subscription_id,
}));

const csvLines = [headers.join(',')];
for (const r of records) {
  csvLines.push([
    escapeCsv(formatDate(r.registered_at)),
    escapeCsv(r.login_id),
    escapeCsv(r.email),
    escapeCsv(r.status_label),
    escapeCsv(formatDate(r.trial_end)),
    escapeCsv(formatDate(r.activated_at)),
    escapeCsv(formatDate(r.current_period_end)),
    escapeCsv(formatDate(r.canceled_at)),
    escapeCsv(r.stripe_customer_id),
    escapeCsv(r.stripe_subscription_id),
  ].join(','));
}
const csvBody = '\ufeff' + csvLines.join('\n');

const outDir = resolve(projectRoot, 'customers');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const csvPath = resolve(outDir, 'customers.csv');
const jsonPath = resolve(outDir, 'customers.json');

writeFileSync(csvPath, csvBody, 'utf8');
writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf8');

console.log(`顧客一覧を保存しました（${records.length}件）`);
console.log(' - CSV : ' + csvPath);
console.log(' - JSON: ' + jsonPath);
