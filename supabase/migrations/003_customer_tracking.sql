alter table public.subscriptions
  add column if not exists activated_at timestamptz,
  add column if not exists canceled_at timestamptz;

create or replace view public.customer_directory as
select
  m.user_id,
  m.email,
  m.login_id,
  m.created_at as registered_at,
  s.status,
  s.trial_end,
  s.current_period_end,
  s.activated_at,
  s.canceled_at,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.updated_at as subscription_updated_at
from public.member_profiles m
left join public.subscriptions s on s.user_id = m.user_id;

comment on view public.customer_directory is
  '顧客一覧（管理用）。export-customers スクリプトから service_role で参照することを想定';
