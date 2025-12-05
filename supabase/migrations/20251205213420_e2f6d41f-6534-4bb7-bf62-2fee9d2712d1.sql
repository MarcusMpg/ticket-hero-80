-- Create a SECURITY DEFINER function to check if current user is admin
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuario u
    JOIN public.profiles p ON p.id_usuario = u.id_usuario
    WHERE p.id = auth.uid() 
    AND u.tipo_usuario = 'ADMIN'
  )
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view own data or admins view all" ON public.usuario;

-- Create a non-recursive policy using the security definer function
CREATE POLICY "Users can view own data or admins view all"
ON public.usuario FOR SELECT
USING (
  id_usuario = get_current_user_id_usuario()
  OR is_current_user_admin()
);