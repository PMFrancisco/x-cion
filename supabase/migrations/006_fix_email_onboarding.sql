-- ============================================
-- Fix onboarding_completed for email signups
-- raw_user_meta_data is not reliably available at trigger time for email signups
-- with confirmation enabled. Use raw_app_meta_data->>'provider' instead,
-- which Supabase always sets at insert time.
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, role, onboarding_completed)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    ),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    'user',
    -- Email signups already provided username/display_name in the register form
    -- OAuth signups (google, etc.) need onboarding to pick a handle
    (new.raw_app_meta_data->>'provider' = 'email')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Backfill existing email users incorrectly marked as needing onboarding
update public.profiles p
set onboarding_completed = true
from auth.users u
where p.id = u.id
  and u.raw_app_meta_data->>'provider' = 'email'
  and p.onboarding_completed = false;
