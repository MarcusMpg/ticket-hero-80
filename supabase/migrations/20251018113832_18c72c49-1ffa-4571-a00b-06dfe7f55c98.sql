-- Atualizar a função is_current_user_atendente para incluir admins
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
    AND u.tipo_usuario IN ('atendente', 'admin')
  )
$$;

-- Recriar a política de visualização de chamados para garantir que funcione corretamente
DROP POLICY IF EXISTS "Users can view own chamados" ON public.chamados;

CREATE POLICY "Users can view own chamados"
ON public.chamados
FOR SELECT
TO authenticated
USING (
  id_solicitante = get_current_user_id_usuario() 
  OR id_atendente = get_current_user_id_usuario() 
  OR is_current_user_atendente()
);