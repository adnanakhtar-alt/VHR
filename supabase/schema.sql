-- ============================================================
-- HR PORTAL - SUPABASE DATABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text not null,
  role text not null default 'employee' check (role in ('admin', 'hr', 'employee')),
  designation text,
  department text,
  phone text,
  joining_date date,
  avatar_url text,
  is_active boolean default true,
  total_leaves integer default 20,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  employee_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status text default 'present' check (status in ('present', 'absent', 'late', 'half-day', 'holiday')),
  missed_reason text,        -- regulation note if attendance was missed
  regulation_approved boolean default false,
  notes text,
  created_at timestamptz default now(),
  unique(employee_id, date)
);

-- ============================================================
-- LEAVES TABLE
-- ============================================================
create table public.leaves (
  id uuid default uuid_generate_v4() primary key,
  employee_id uuid references public.profiles(id) on delete cascade not null,
  leave_type text not null check (leave_type in ('annual', 'sick', 'casual', 'unpaid', 'emergency')),
  start_date date not null,
  end_date date not null,
  days_count integer not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- NEWS / ANNOUNCEMENTS TABLE
-- ============================================================
create table public.news (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  category text default 'general' check (category in ('general', 'holiday', 'urgent', 'event', 'policy')),
  is_published boolean default true,
  posted_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- EMAIL LOGS TABLE
-- ============================================================
create table public.email_logs (
  id uuid default uuid_generate_v4() primary key,
  sent_by uuid references public.profiles(id),
  recipients text[] not null,
  subject text not null,
  body text not null,
  status text default 'sent' check (status in ('sent', 'failed')),
  created_at timestamptz default now()
);

-- ============================================================
-- LINKEDIN POSTS TABLE
-- ============================================================
create table public.linkedin_posts (
  id uuid default uuid_generate_v4() primary key,
  posted_by uuid references public.profiles(id),
  content text not null,
  status text default 'draft' check (status in ('draft', 'published', 'failed')),
  linkedin_post_id text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.attendance enable row level security;
alter table public.leaves enable row level security;
alter table public.news enable row level security;
alter table public.email_logs enable row level security;
alter table public.linkedin_posts enable row level security;

-- Profiles: users see their own; admins/hr see all
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'hr'))
  );

create policy "Admins can insert profiles" on public.profiles
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'hr'))
  );

create policy "Admins can update profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'hr'))
  );

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Attendance: employees see own, admins see all
create policy "Employees view own attendance" on public.attendance
  for select using (auth.uid() = employee_id);

create policy "Admins view all attendance" on public.attendance
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'hr'))
  );

create policy "Employees insert own attendance" on public.attendance
  for insert with check (auth.uid() = employee_id);

create policy "Employees update own attendance" on public.attendance
  for update using (auth.uid() = employee_id);

create policy "Admins update any attendance" on public.attendance
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'hr'))
  );

-- Leaves: employees see own, admins see all
create policy "Employees view own leaves" on public.leaves
  for select using (auth.uid() = employee_id);

create policy "Admins view all leaves" on public.leaves
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'hr'))
  );

create policy "Employees insert leaves" on public.leaves
  for insert with check (auth.uid() = employee_id);

create policy "Admins update leaves" on public.leaves
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'hr'))
  );

-- News: everyone can read, only admins write
create policy "Everyone reads news" on public.news
  for select using (true);

create policy "Admins manage news" on public.news
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'hr'))
  );

-- Email logs: admins only
create policy "Admins manage emails" on public.email_logs
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'hr'))
  );

-- LinkedIn: admins only
create policy "Admins manage linkedin" on public.linkedin_posts
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'hr'))
  );

-- ============================================================
-- FUNCTION: Auto-create profile when user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SEED: Insert first admin (run after you create your account)
-- UPDATE THE EMAIL BELOW to your own email before running
-- ============================================================
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
