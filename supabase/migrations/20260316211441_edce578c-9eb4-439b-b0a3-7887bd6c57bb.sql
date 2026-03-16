
DROP POLICY IF EXISTS "Users can update chamados" ON public.chamados;

CREATE POLICY "Users can update chamados"
ON public.chamados
FOR UPDATE
TO authenticated
USING (
  id_solicitante = get_current_user_id_usuario()
  OR is_current_user_atendente()
  OR (SELECT u.tipo_usuario FROM public.usuario u JOIN public.profiles p ON p.id_usuario = u.id_usuario WHERE p.id = auth.uid()) = 'DIRETOR'
);
