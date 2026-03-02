-- ============================================
-- Add onboarding_completed flag to profiles
-- ============================================

-- New column: defaults to false for new rows
alter table profiles add column onboarding_completed boolean default false not null;

-- Backfill: all existing users are already set up
update profiles set onboarding_completed = true;

-- Replace the trigger function so email signups are marked complete immediately
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
    -- Email signups provide a username; OAuth signups do not
    (new.raw_user_meta_data->>'username') is not null
  );
  return new;
end;
$$ language plpgsql security definer;
