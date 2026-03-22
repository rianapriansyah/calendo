-- Calendo: profiles, events, event_attachments, RLS, storage bucket

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  username text NOT NULL UNIQUE,
  avatar_url text,
  bio text,
  timezone text NOT NULL DEFAULT 'UTC',
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_all_day boolean NOT NULL DEFAULT false,
  color text NOT NULL DEFAULT 'sky',
  location text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_color_check CHECK (
    color IN ('amber', 'sage', 'sky', 'rose', 'violet', 'orange')
  ),
  CONSTRAINT events_time_check CHECK (end_time >= start_time)
);

CREATE TABLE public.event_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL
);

CREATE INDEX events_user_start ON public.events (user_id, start_time);
CREATE UNIQUE INDEX profiles_username_lower_unique ON public.profiles (lower(username));
CREATE INDEX event_attachments_event_id ON public.event_attachments (event_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile row on signup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, timezone, is_public)
  VALUES (
    new.id,
    COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''), ''),
    'u_' || replace(new.id::text, '-', ''),
    COALESCE(NULLIF(TRIM(new.raw_user_meta_data->>'timezone'), ''), 'UTC'),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Case-insensitive public profile lookup (used by Edge Functions; avoids ILIKE wildcards in params)
CREATE OR REPLACE FUNCTION public.match_public_profile(p_username text)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.profiles
  WHERE lower(username) = lower(trim(p_username))
    AND is_public = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.match_public_profile(text) TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_own_or_public"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR is_public = true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- events: owner
CREATE POLICY "events_select_owner"
  ON public.events FOR SELECT
  USING (auth.uid() = user_id);

-- events: public calendar (event + owner profile public)
CREATE POLICY "events_select_public"
  ON public.events FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = events.user_id
        AND p.is_public = true
    )
  );

CREATE POLICY "events_insert_own"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_update_own"
  ON public.events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_delete_own"
  ON public.events FOR DELETE
  USING (auth.uid() = user_id);

-- event_attachments (mirror event visibility)
CREATE POLICY "event_attachments_select"
  ON public.event_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_attachments.event_id
        AND (
          e.user_id = auth.uid()
          OR (
            e.is_public = true
            AND EXISTS (
              SELECT 1
              FROM public.profiles p
              WHERE p.id = e.user_id
                AND p.is_public = true
            )
          )
        )
    )
  );

CREATE POLICY "event_attachments_insert_own_event"
  ON public.event_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_attachments.event_id
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "event_attachments_delete_own_event"
  ON public.event_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_attachments.event_id
        AND e.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: event-attachments
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-attachments', 'event-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "event_attachments_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'event-attachments'
    AND (
      (
        auth.role() = 'authenticated'
        AND split_part(name, '/', 1) = auth.uid()::text
      )
      OR EXISTS (
        SELECT 1
        FROM public.events e
        JOIN public.profiles p ON p.id = e.user_id
        WHERE e.is_public = true
          AND p.is_public = true
          AND e.id::text = split_part(name, '/', 2)
      )
    )
  );

CREATE POLICY "event_attachments_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-attachments'
    AND auth.role() = 'authenticated'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id::text = split_part(name, '/', 2)
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "event_attachments_storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-attachments'
    AND auth.role() = 'authenticated'
    AND split_part(name, '/', 1) = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id::text = split_part(name, '/', 2)
        AND e.user_id = auth.uid()
    )
  );
