-- PIN authentication is now handled by Edge Functions with service-role access.
-- Browser clients should not read or mutate account tables directly.

drop policy if exists "Users can read own member profile" on public.member_profiles;
drop policy if exists "Users can update own member profile" on public.member_profiles;

drop policy if exists "Users can read own subscription" on public.subscriptions;
drop policy if exists "Users can insert own subscription" on public.subscriptions;
drop policy if exists "Users can update own subscription" on public.subscriptions;
