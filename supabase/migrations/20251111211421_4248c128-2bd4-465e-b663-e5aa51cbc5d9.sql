-- Create RLS policy for deleting chamados
-- Admins can delete any chamado
-- Regular users can only delete their own chamados if status is ABERTO

CREATE POLICY "Users can delete own open chamados, admins can delete any"
ON public.chamados
FOR DELETE
USING (
  -- Admin can delete any chamado
  (
    EXISTS (
      SELECT 1 
      FROM public.usuario u
      JOIN public.profiles p ON p.id_usuario = u.id_usuario
      WHERE p.id = auth.uid() 
      AND u.tipo_usuario = 'ADMIN'
    )
  )
  OR
  -- Regular users can only delete their own chamados if status is ABERTO
  (
    id_solicitante = get_current_user_id_usuario()
    AND status_chamado = 'ABERTO'
  )
);