-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view usuarios" ON public.usuario;

-- Create a more restrictive policy: users see their own data, admins see all
CREATE POLICY "Users can view own data or admins view all"
ON public.usuario FOR SELECT
USING (
  id_usuario = get_current_user_id_usuario()
  OR EXISTS (
    SELECT 1 FROM usuario u
    JOIN profiles p ON p.id_usuario = u.id_usuario
    WHERE p.id = auth.uid() AND u.tipo_usuario = 'ADMIN'
  )
);