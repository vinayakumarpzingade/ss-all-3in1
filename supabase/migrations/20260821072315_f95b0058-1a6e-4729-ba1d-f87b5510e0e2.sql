-- 1. Mock tests: answer visibility
ALTER TABLE public.mock_tests ADD COLUMN IF NOT EXISTS show_answers boolean NOT NULL DEFAULT false;

-- 2. New section kinds for reading + video
ALTER TYPE section_kind ADD VALUE IF NOT EXISTS 'reading';
ALTER TYPE section_kind ADD VALUE IF NOT EXISTS 'video';

-- 3. Week sections: media + required flag
ALTER TABLE public.week_sections ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.week_sections ADD COLUMN IF NOT EXISTS is_required boolean NOT NULL DEFAULT true;

-- 4. Coding practice details
ALTER TABLE public.coding_questions ADD COLUMN IF NOT EXISTS input_description text;
ALTER TABLE public.coding_questions ADD COLUMN IF NOT EXISTS output_description text;
ALTER TABLE public.coding_questions ADD COLUMN IF NOT EXISTS constraints text;
ALTER TABLE public.coding_questions ADD COLUMN IF NOT EXISTS examples jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.coding_questions ADD COLUMN IF NOT EXISTS test_cases jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 5. Assigned projects: due date
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS due_at timestamptz;

-- 6. Personal projects on existing submissions table
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS project_type text NOT NULL DEFAULT 'individual';
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS team_members jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS secondary_domain text;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS custom_domain text;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS completion_date date;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.project_submissions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- students can edit their own submission before review
DROP POLICY IF EXISTS "students update own submissions" ON public.project_submissions;
CREATE POLICY "students update own submissions" ON public.project_submissions
  FOR UPDATE TO authenticated
  USING (student_id = public.my_student_id() AND status = 'submitted')
  WITH CHECK (student_id = public.my_student_id());

-- 7. Students: gender
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender text;

-- 8. College logo
ALTER TABLE public.colleges ADD COLUMN IF NOT EXISTS logo_url text;

-- 9. Sequential week progression enforced in the database
CREATE OR REPLACE FUNCTION public.week_required_kinds(_week_id uuid)
RETURNS section_kind[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select coalesce(array_agg(distinct kind), '{}'::section_kind[])
  from public.week_sections
  where week_id = _week_id and is_required
$$;

CREATE OR REPLACE FUNCTION public.is_week_complete(_student_id uuid, _week_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE req section_kind[]; done int;
BEGIN
  req := public.week_required_kinds(_week_id);
  IF array_length(req, 1) IS NULL THEN RETURN false; END IF;
  SELECT count(distinct kind) INTO done FROM public.progress
    WHERE student_id = _student_id AND week_id = _week_id AND completed AND kind = ANY(req);
  RETURN done >= array_length(req, 1);
END; $$;

CREATE OR REPLACE FUNCTION public.is_week_unlocked(_student_id uuid, _week_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE prev uuid; wnum int; pid uuid;
BEGIN
  SELECT path_id, week_number INTO pid, wnum FROM public.weeks WHERE id = _week_id;
  IF pid IS NULL THEN RETURN false; END IF;
  SELECT id INTO prev FROM public.weeks
    WHERE path_id = pid AND week_number < wnum AND is_published AND archived_at IS NULL
    ORDER BY week_number DESC LIMIT 1;
  IF prev IS NULL THEN RETURN true; END IF;
  RETURN public.is_week_complete(_student_id, prev) AND public.is_week_unlocked(_student_id, prev);
END; $$;

CREATE OR REPLACE FUNCTION public.enforce_week_unlock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_week_unlocked(NEW.student_id, NEW.week_id) THEN
    RAISE EXCEPTION 'This week is locked. Complete the previous week first.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_week_unlock ON public.progress;
CREATE TRIGGER trg_week_unlock BEFORE INSERT OR UPDATE ON public.progress
  FOR EACH ROW EXECUTE FUNCTION public.enforce_week_unlock();