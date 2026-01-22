-- Add policy for admin_users table (only allow select for admin verification)
CREATE POLICY "Allow admin login verification" ON public.admin_users FOR SELECT USING (true);