REVOKE ALL ON FUNCTION public.enforce_week_unlock() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.week_required_kinds(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.is_week_complete(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.is_week_unlocked(uuid, uuid) FROM anon;