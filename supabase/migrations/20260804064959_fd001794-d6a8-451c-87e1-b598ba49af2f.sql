
-- ROLES
create type public.app_role as enum ('super_admin','college','student');

create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  city text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.colleges to authenticated;
grant all on public.colleges to service_role;
alter table public.colleges enable row level security;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.app_role not null default 'student',
  college_id uuid references public.colleges(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.my_college_id()
returns uuid language sql stable security definer set search_path = public as $$
  select college_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'super_admin')
$$;

create policy "colleges readable" on public.colleges for select to authenticated using (true);
create policy "colleges admin write" on public.colleges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "profiles self read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin() or college_id = public.my_college_id());
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "roles self read" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- STUDENTS
create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  name text not null,
  usn text not null,
  email text not null,
  semester int not null default 1,
  department text not null default 'CSE',
  placement_readiness int not null default 0,
  learning_progress int not null default 0,
  mock_score int not null default 0,
  coding_score int not null default 0,
  created_at timestamptz not null default now(),
  unique (college_id, usn)
);
grant select, insert, update, delete on public.students to authenticated;
grant all on public.students to service_role;
alter table public.students enable row level security;
create policy "students admin all" on public.students for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "students college manage" on public.students for all to authenticated
  using (college_id = public.my_college_id()) with check (college_id = public.my_college_id());
create policy "students self read" on public.students for select to authenticated
  using (profile_id = auth.uid());

create or replace function public.my_student_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.students where profile_id = auth.uid()
$$;

-- LEARNING CONTENT
create table public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  course text default '',
  department text default '',
  semester int,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.learning_paths to authenticated;
grant all on public.learning_paths to service_role;
alter table public.learning_paths enable row level security;
create policy "paths admin write" on public.learning_paths for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "paths readable" on public.learning_paths for select to authenticated using (true);

create table public.college_paths (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (college_id, path_id)
);
grant select, insert, update, delete on public.college_paths to authenticated;
grant all on public.college_paths to service_role;
alter table public.college_paths enable row level security;
create policy "college_paths admin write" on public.college_paths for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "college_paths readable" on public.college_paths for select to authenticated using (true);

create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  week_number int not null,
  title text not null,
  raw_content text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (path_id, week_number)
);
grant select, insert, update, delete on public.weeks to authenticated;
grant all on public.weeks to service_role;
alter table public.weeks enable row level security;
create policy "weeks admin write" on public.weeks for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "weeks readable" on public.weeks for select to authenticated
  using (is_published or public.is_admin());

create type public.section_kind as enum
  ('objectives','cheat_sheet','mcq','coding','mini_project','assignment','resources','interview');

create table public.week_sections (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  kind public.section_kind not null,
  title text not null default '',
  body text not null default '',
  items jsonb not null default '[]'::jsonb,
  position int not null default 0
);
grant select, insert, update, delete on public.week_sections to authenticated;
grant all on public.week_sections to service_role;
alter table public.week_sections enable row level security;
create policy "sections admin write" on public.week_sections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "sections readable" on public.week_sections for select to authenticated
  using (exists (select 1 from public.weeks w where w.id = week_id and (w.is_published or public.is_admin())));

create table public.mcqs (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_index int not null default 0,
  explanation text default '',
  position int not null default 0
);
grant select, insert, update, delete on public.mcqs to authenticated;
grant all on public.mcqs to service_role;
alter table public.mcqs enable row level security;
create policy "mcqs admin write" on public.mcqs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "mcqs readable" on public.mcqs for select to authenticated using (true);

create table public.coding_questions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid references public.weeks(id) on delete cascade,
  path_id uuid references public.learning_paths(id) on delete cascade,
  title text not null,
  prompt text not null default '',
  language text not null default 'python',
  starter_code text default '',
  expected_output text default '',
  difficulty text not null default 'easy',
  points int not null default 10,
  position int not null default 0
);
grant select, insert, update, delete on public.coding_questions to authenticated;
grant all on public.coding_questions to service_role;
alter table public.coding_questions enable row level security;
create policy "coding admin write" on public.coding_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "coding readable" on public.coding_questions for select to authenticated using (true);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  week_id uuid references public.weeks(id) on delete cascade,
  title text not null,
  brief text default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "projects admin write" on public.projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "projects readable" on public.projects for select to authenticated using (true);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  week_id uuid references public.weeks(id) on delete cascade,
  title text not null,
  brief text default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.assignments to authenticated;
grant all on public.assignments to service_role;
alter table public.assignments enable row level security;
create policy "assignments admin write" on public.assignments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "assignments readable" on public.assignments for select to authenticated using (true);

-- MOCK TESTS
create table public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  duration_minutes int not null default 30,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.mock_tests to authenticated;
grant all on public.mock_tests to service_role;
alter table public.mock_tests enable row level security;
create policy "mock admin write" on public.mock_tests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "mock readable" on public.mock_tests for select to authenticated using (true);

create table public.mock_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  correct_index int not null default 0,
  position int not null default 0
);
grant select, insert, update, delete on public.mock_questions to authenticated;
grant all on public.mock_questions to service_role;
alter table public.mock_questions enable row level security;
create policy "mockq admin write" on public.mock_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "mockq readable" on public.mock_questions for select to authenticated using (true);

create table public.mock_assignments (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (test_id, college_id)
);
grant select, insert, update, delete on public.mock_assignments to authenticated;
grant all on public.mock_assignments to service_role;
alter table public.mock_assignments enable row level security;
create policy "mocka admin write" on public.mock_assignments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "mocka readable" on public.mock_assignments for select to authenticated using (true);

create table public.mock_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.mock_tests(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  score int not null default 0,
  total int not null default 0,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.mock_attempts to authenticated;
grant all on public.mock_attempts to service_role;
alter table public.mock_attempts enable row level security;
create policy "attempts admin read" on public.mock_attempts for select to authenticated
  using (public.is_admin() or college_id = public.my_college_id() or student_id = public.my_student_id());
create policy "attempts student write" on public.mock_attempts for insert to authenticated
  with check (student_id = public.my_student_id());

create table public.coding_submissions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.coding_questions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  language text not null default 'python',
  code text not null default '',
  status text not null default 'pending',
  output text default '',
  passed boolean not null default false,
  score int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.coding_submissions to authenticated;
grant all on public.coding_submissions to service_role;
alter table public.coding_submissions enable row level security;
create policy "codesub read" on public.coding_submissions for select to authenticated
  using (public.is_admin() or college_id = public.my_college_id() or student_id = public.my_student_id());
create policy "codesub student write" on public.coding_submissions for insert to authenticated
  with check (student_id = public.my_student_id());

create table public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  student_id uuid not null references public.students(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  name text not null,
  github_url text default '',
  description text default '',
  file_url text default '',
  status text not null default 'submitted',
  review_note text default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.project_submissions to authenticated;
grant all on public.project_submissions to service_role;
alter table public.project_submissions enable row level security;
create policy "projsub read" on public.project_submissions for select to authenticated
  using (public.is_admin() or college_id = public.my_college_id() or student_id = public.my_student_id());
create policy "projsub student write" on public.project_submissions for insert to authenticated
  with check (student_id = public.my_student_id());
create policy "projsub reviewer update" on public.project_submissions for update to authenticated
  using (public.is_admin() or college_id = public.my_college_id())
  with check (public.is_admin() or college_id = public.my_college_id());

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  content text not null default '',
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.assignment_submissions to authenticated;
grant all on public.assignment_submissions to service_role;
alter table public.assignment_submissions enable row level security;
create policy "asub read" on public.assignment_submissions for select to authenticated
  using (public.is_admin() or college_id = public.my_college_id() or student_id = public.my_student_id());
create policy "asub student write" on public.assignment_submissions for insert to authenticated
  with check (student_id = public.my_student_id());

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  week_id uuid not null references public.weeks(id) on delete cascade,
  kind public.section_kind not null,
  completed boolean not null default true,
  completed_at timestamptz not null default now(),
  unique (student_id, week_id, kind)
);
grant select, insert, update, delete on public.progress to authenticated;
grant all on public.progress to service_role;
alter table public.progress enable row level security;
create policy "progress read" on public.progress for select to authenticated
  using (public.is_admin() or college_id = public.my_college_id() or student_id = public.my_student_id());
create policy "progress student insert" on public.progress for insert to authenticated
  with check (student_id = public.my_student_id());
create policy "progress student update" on public.progress for update to authenticated
  using (student_id = public.my_student_id()) with check (student_id = public.my_student_id());
create policy "progress student delete" on public.progress for delete to authenticated
  using (student_id = public.my_student_id());

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  college_id uuid not null references public.colleges(id) on delete cascade,
  path_id uuid references public.learning_paths(id) on delete set null,
  title text not null,
  serial text not null unique,
  issued_at timestamptz not null default now()
);
grant select, insert, update, delete on public.certificates to authenticated;
grant all on public.certificates to service_role;
alter table public.certificates enable row level security;
create policy "cert read" on public.certificates for select to authenticated
  using (public.is_admin() or college_id = public.my_college_id() or student_id = public.my_student_id());
create policy "cert student insert" on public.certificates for insert to authenticated
  with check (student_id = public.my_student_id());

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  college_id uuid references public.colleges(id) on delete cascade,
  title text not null,
  body text default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notif read" on public.notifications for select to authenticated
  using (user_id = auth.uid() or college_id = public.my_college_id() or public.is_admin());
create policy "notif write" on public.notifications for insert to authenticated with check (true);
create policy "notif update" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- AGGREGATE STATS TRIGGERS
create or replace function public.recalc_student_stats()
returns trigger language plpgsql security definer set search_path = public as $$
declare sid uuid; total_weeks int; done int; mock int; code int;
begin
  sid := coalesce(new.student_id, old.student_id);
  select count(*) into total_weeks from public.weeks w where w.is_published;
  select count(distinct week_id) into done from public.progress where student_id = sid and completed;
  select coalesce(round(avg(case when total > 0 then score::numeric*100/total else 0 end)),0)
    into mock from public.mock_attempts where student_id = sid;
  select coalesce(sum(score),0) into code from public.coding_submissions where student_id = sid and passed;
  update public.students set
    learning_progress = case when total_weeks > 0 then least(100, round(done::numeric*100/total_weeks)) else 0 end,
    mock_score = mock,
    coding_score = code,
    placement_readiness = least(100, round(
      (case when total_weeks > 0 then least(100, done::numeric*100/total_weeks) else 0 end) * 0.4
      + mock * 0.35 + least(100, code) * 0.25))
  where id = sid;
  return null;
end; $$;

create trigger trg_progress_stats after insert or update or delete on public.progress
  for each row execute function public.recalc_student_stats();
create trigger trg_mock_stats after insert or update or delete on public.mock_attempts
  for each row execute function public.recalc_student_stats();
create trigger trg_code_stats after insert or update or delete on public.coding_submissions
  for each row execute function public.recalc_student_stats();

alter table public.weeks replica identity full;
alter table public.progress replica identity full;
alter table public.students replica identity full;
alter table public.mock_attempts replica identity full;
alter table public.coding_submissions replica identity full;
alter table public.project_submissions replica identity full;
alter table public.certificates replica identity full;
alter table public.notifications replica identity full;

alter publication supabase_realtime add table public.weeks;
alter publication supabase_realtime add table public.week_sections;
alter publication supabase_realtime add table public.progress;
alter publication supabase_realtime add table public.students;
alter publication supabase_realtime add table public.mock_attempts;
alter publication supabase_realtime add table public.coding_submissions;
alter publication supabase_realtime add table public.project_submissions;
alter publication supabase_realtime add table public.certificates;
alter publication supabase_realtime add table public.notifications;
