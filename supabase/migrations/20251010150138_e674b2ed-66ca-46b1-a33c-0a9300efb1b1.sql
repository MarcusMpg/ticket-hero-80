-- Fix search_path for helper functions
CREATE OR REPLACE FUNCTION public.get_current_user_id_usuario()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.id_usuario 
  FROM public.profiles p 
  WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_atendente()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuario u
    JOIN public.profiles p ON p.id_usuario = u.id_usuario
    WHERE p.id = auth.uid() AND u.tipo_usuario = 'atendente'
  )
$$;