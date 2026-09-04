CREATE TABLE public.mcq_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  week_id uuid NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.mcqs(id) ON DELETE CASCADE,
  selected_index integer,
  correct boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mcq_attempts TO authenticated;
GRANT ALL ON public.mcq_attempts TO service_role;
ALTER TABLE public.mcq_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view their own MCQ attempts" ON public.mcq_attempts FOR SELECT TO authenticated USING (student_id = public.my_student_id());
CREATE POLICY "Students can create their own MCQ attempts" ON public.mcq_attempts FOR INSERT TO authenticated WITH CHECK (student_id = public.my_student_id() AND college_id = public.my_college_id());
CREATE POLICY "College users can view college MCQ attempts" ON public.mcq_attempts FOR SELECT TO authenticated USING (college_id = public.my_college_id());
CREATE POLICY "Admins can view MCQ attempts" ON public.mcq_attempts FOR SELECT TO authenticated USING (public.is_admin());