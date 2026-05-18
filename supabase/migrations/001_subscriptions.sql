-- サブスクリプション管理テーブル
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'trialing',
  trial_end timestamptz not null default (now() + interval '7 days'),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS（Row Level Security）を有効化
alter table public.subscriptions enable row level security;

-- ユーザーは自分のサブスク情報のみ読み取り可能
create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ユーザーは自分のサブスクを作成可能（新規登録時）
create policy "Users can insert own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

-- service_role（webhook）からは全操作可能（RLSバイパス）
-- → Edge FunctionではsupabaseAdminクライアント（service_role key）を使う
