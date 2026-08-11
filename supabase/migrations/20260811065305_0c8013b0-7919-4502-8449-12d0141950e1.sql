-- ============ COURSES ============
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses readable by authenticated" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "courses managed by admin" ON public.courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.courses (code, name) VALUES
  ('B.Tech','Bachelor of Technology'),
  ('B.E.','Bachelor of Engineering'),
  ('BCA','Bachelor of Computer Applications'),
  ('B.Com','Bachelor of Commerce'),
  ('BBA','Bachelor of Business Administration'),
  ('BA','Bachelor of Arts'),
  ('B.Sc','Bachelor of Science'),
  ('BVA','Bachelor of Visual Arts'),
  ('MBA','Master of Business Administration'),
  ('MCA','Master of Computer Applications'),
  ('M.Com','Master of Commerce'),
  ('M.Tech','Master of Technology'),
  ('M.Sc','Master of Science'),
  ('Diploma','Diploma')
ON CONFLICT (code) DO NOTHING;

-- ============ COLLEGES ============
ALTER TABLE public.colleges
  ADD COLUMN IF NOT EXISTS college_code text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS officer_name text,
  ADD COLUMN IF NOT EXISTS officer_email text,
  ADD COLUMN IF NOT EXISTS officer_phone text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

UPDATE public.colleges SET location = COALESCE(location, city);

CREATE SEQUENCE IF NOT EXISTS public.college_code_seq START 1;

CREATE OR REPLACE FUNCTION public.build_college_code(_code text, _city text)
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; loc text;
BEGIN
  base := upper(regexp_replace(coalesce(_code,'COL'), '[^A-Za-z0-9]', '', 'g'));
  IF base = '' THEN base := 'COL'; END IF;
  loc := upper(regexp_replace(coalesce(_city,''), '[^A-Za-z]', '', 'g'));
  loc := CASE WHEN length(loc) >= 3 THEN substr(loc,1,3) ELSE 'GEN' END;
  RETURN base || '-' || loc || '-' || lpad(nextval('public.college_code_seq')::text, 3, '0');
END; $$;

UPDATE public.colleges
  SET college_code = public.build_college_code(code, coalesce(location, city))
  WHERE college_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS colleges_college_code_key ON public.colleges (college_code);

CREATE OR REPLACE FUNCTION public.colleges_code_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.college_code IS NULL OR NEW.college_code = '' THEN
      NEW.college_code := public.build_college_code(NEW.code, coalesce(NEW.location, NEW.city));
    END IF;
  ELSE
    NEW.college_code := OLD.college_code;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_colleges_code_guard ON public.colleges;
CREATE TRIGGER trg_colleges_code_guard BEFORE INSERT OR UPDATE ON public.colleges
  FOR EACH ROW EXECUTE FUNCTION public.colleges_code_guard();

CREATE TABLE IF NOT EXISTS public.college_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  course_code text NOT NULL REFERENCES public.courses(code) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (college_id, course_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.college_courses TO authenticated;
GRANT ALL ON public.college_courses TO service_role;
ALTER TABLE public.college_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "college_courses readable" ON public.college_courses FOR SELECT TO authenticated USING (public.is_admin() OR college_id = public.my_college_id());
CREATE POLICY "college_courses admin write" ON public.college_courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ STUDENTS ============
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS course text,
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- ============ LEARNING PATHS ============
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.weeks ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.mcqs ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.coding_questions ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE TABLE IF NOT EXISTS public.learning_path_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  course_code text NOT NULL REFERENCES public.courses(code) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (path_id, course_code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_path_courses TO authenticated;
GRANT ALL ON public.learning_path_courses TO service_role;
ALTER TABLE public.learning_path_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp_courses readable" ON public.learning_path_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "lp_courses admin write" ON public.learning_path_courses FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.learning_path_courses (path_id, course_code)
SELECT lp.id, c.code FROM public.learning_paths lp
JOIN public.courses c ON c.code = lp.course
ON CONFLICT DO NOTHING;

-- ============ MOCK TESTS ============
ALTER TABLE public.mock_tests
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS total_marks integer,
  ADD COLUMN IF NOT EXISTS passing_marks integer,
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS max_violations integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS target_course text,
  ADD COLUMN IF NOT EXISTS target_semester integer,
  ADD COLUMN IF NOT EXISTS start_at timestamptz,
  ADD COLUMN IF NOT EXISTS end_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- ============ MOCK ATTEMPTS ============
ALTER TABLE public.mock_attempts
  ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS time_taken_seconds integer,
  ADD COLUMN IF NOT EXISTS tab_switch_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fullscreen_exit_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS violations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_submitted boolean NOT NULL DEFAULT false;

UPDATE public.mock_attempts SET started_at = COALESCE(started_at, created_at), submitted_at = COALESCE(submitted_at, created_at);

-- enforce attempt limits server-side
CREATE OR REPLACE FUNCTION public.enforce_attempt_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE used int; allowed int;
BEGIN
  SELECT count(*) INTO used FROM public.mock_attempts WHERE student_id = NEW.student_id AND test_id = NEW.test_id;
  SELECT coalesce(max_attempts, 3) INTO allowed FROM public.mock_tests WHERE id = NEW.test_id;
  IF allowed IS NOT NULL AND allowed > 0 AND used >= allowed THEN
    RAISE EXCEPTION 'Attempt limit reached for this test (% of % used)', used, allowed;
  END IF;
  NEW.attempt_number := used + 1;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_attempt_limit ON public.mock_attempts;
CREATE TRIGGER trg_attempt_limit BEFORE INSERT ON public.mock_attempts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_attempt_limit();

-- ============ PROJECT SUBMISSIONS ============
ALTER TABLE public.project_submissions
  ADD COLUMN IF NOT EXISTS objectives text,
  ADD COLUMN IF NOT EXISTS tech_stack text,
  ADD COLUMN IF NOT EXISTS demo_url text,
  ADD COLUMN IF NOT EXISTS docs_url text,
  ADD COLUMN IF NOT EXISTS deadline timestamptz,
  ADD COLUMN IF NOT EXISTS score integer,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- ============ BEST-SCORE STATS ============
CREATE OR REPLACE FUNCTION public.recalc_student_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare sid uuid; total_weeks int; done int; mock int; code int;
begin
  sid := coalesce(new.student_id, old.student_id);
  select count(*) into total_weeks from public.weeks w
    join public.learning_paths lp on lp.id = w.path_id
    where w.is_published and w.archived_at is null and lp.archived_at is null;
  select count(distinct week_id) into done from public.progress where student_id = sid and completed;
  -- best score per test, then averaged across tests
  select coalesce(round(avg(best_pct)), 0) into mock from (
    select max(case when total > 0 then score::numeric * 100 / total else 0 end) as best_pct
    from public.mock_attempts where student_id = sid group by test_id
  ) t;
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

-- realtime for new/updated tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.college_courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_path_courses;