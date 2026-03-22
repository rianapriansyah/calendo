-- Case-insensitive profile lookup for Edge Functions (service role); not exposed to anon REST.
CREATE OR REPLACE FUNCTION public.get_profile_by_username(p_username text)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.profiles
  WHERE lower(username) = lower(trim(p_username))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_profile_by_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_by_username(text) TO service_role;
