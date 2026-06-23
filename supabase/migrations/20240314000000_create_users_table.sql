-- Create users table for portal authentication
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  name text,
  email text,
  role text default 'admin'
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Policies for users table
-- Users can read their own profile
create policy "Users can read own profile" on public.users
  for select using (auth.uid() = id);

-- Admins can read all profiles (Required for user check in AuthContext)
create policy "Admins can read all" on public.users
  for select using (
    exists (
      select 1 from public.users where id = auth.uid() and role = 'admin'
    )
  );

-- Users can insert their own profile during signup
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);
