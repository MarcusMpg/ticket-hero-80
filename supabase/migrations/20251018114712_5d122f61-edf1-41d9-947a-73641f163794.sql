-- Corrigir a função is_current_user_atendente para usar valores em MAIÚSCULO
CREATE OR REPLACE FUNCTION public.is_current_user_atendente()
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
    AND u.tipo_usuario IN ('ATENDENTE', 'ADMIN')
  )
$$;