-- ============================================================
-- Run this ONCE in the Supabase SQL Editor
-- Project: BAPSComplex / Yogi Sports Complex
-- ============================================================

-- 1. Add is_staff column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_staff boolean DEFAULT false NOT NULL;

-- 2. Create member-avatars storage bucket (public read, auth upload)
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-avatars', 'member-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow any authenticated user to upload/update their own avatar
DROP POLICY IF EXISTS "Auth users upload avatar" ON storage.objects;
CREATE POLICY "Auth users upload avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'member-avatars');

DROP POLICY IF EXISTS "Auth users update avatar" ON storage.objects;
CREATE POLICY "Auth users update avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'member-avatars');

-- Allow public read of all avatars
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'member-avatars');

-- 3. RPC for the security staff portal — bypasses member RLS
CREATE OR REPLACE FUNCTION get_staff_arrivals(p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  booking_id   uuid,
  start_time   time,
  end_time     time,
  space_name   text,
  member_name  text,
  avatar_url   text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only callable by staff or admins
  IF NOT (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_staff = true)
    OR
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    b.id          AS booking_id,
    b.start_time  AS start_time,
    b.end_time    AS end_time,
    s.name        AS space_name,
    p.full_name   AS member_name,
    p.avatar_url  AS avatar_url
  FROM bookings b
  JOIN profiles p ON b.user_id = p.id
  JOIN spaces   s ON b.space_id = s.id
  WHERE b.date = p_date
    AND b.status = 'confirmed'
  ORDER BY b.start_time ASC;
END;
$$;

-- 4. Feedback / suggestions table
CREATE TABLE IF NOT EXISTS feedback (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  member_name text,
  category    text DEFAULT 'suggestion',
  message     text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can read feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can delete feedback" ON feedback;

CREATE POLICY "Members can submit feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete feedback"
  ON feedback FOR DELETE
  TO authenticated
  USING (is_admin());
