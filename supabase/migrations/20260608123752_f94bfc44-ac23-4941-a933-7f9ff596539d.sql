
-- 1. chamados: change public role policies to authenticated
ALTER POLICY "Atendentes veem chamados do seu setor" ON public.chamados TO authenticated;
ALTER POLICY "Diretores e Admins veem tudo" ON public.chamados TO authenticated;
ALTER POLICY "Users can delete own open chamados, admins can delete any" ON public.chamados TO authenticated;

-- 2. usuario: change public role policies to authenticated
ALTER POLICY "Admins can delete usuarios" ON public.usuario TO authenticated;
ALTER POLICY "Admins can update usuarios" ON public.usuario TO authenticated;
ALTER POLICY "Users can view own data or admins view all" ON public.usuario TO authenticated;

-- 3. usuario.senha_hash: never expose to clients via the Data API
REVOKE SELECT (senha_hash) ON public.usuario FROM authenticated, anon;

-- 4. storage: drop obsolete policies pointing to wrong bucket 'anexos_os'
DROP POLICY IF EXISTS "Acesso restrito aos anexos do chamado" ON storage.objects;
DROP POLICY IF EXISTS "Solicitantes podem subir anexos" ON storage.objects;

-- 5. storage: move existing chamado-anexos policies from public->authenticated and add UPDATE policy
ALTER POLICY "Users can delete anexos from their chamados" ON storage.objects TO authenticated;
ALTER POLICY "Users can upload anexos to their chamados" ON storage.objects TO authenticated;
ALTER POLICY "Users can view anexos from their chamados" ON storage.objects TO authenticated;

CREATE POLICY "Users can update own anexos or admins any"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'chamado-anexos' AND (
      public.is_current_user_admin() OR
      (storage.foldername(name))[1] IN (
        SELECT id_chamado::text FROM public.chamados
        WHERE id_solicitante = public.get_current_user_id_usuario()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'chamado-anexos' AND (
      public.is_current_user_admin() OR
      (storage.foldername(name))[1] IN (
        SELECT id_chamado::text FROM public.chamados
        WHERE id_solicitante = public.get_current_user_id_usuario()
      )
    )
  );

-- 6. agendamento: tighten INSERT WITH CHECK from `true` to authenticated user constraint
DROP POLICY IF EXISTS "Authenticated can insert agendamentos" ON public.agendamento;
CREATE POLICY "Authenticated can insert agendamentos"
  ON public.agendamento FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Revoke anonymous EXECUTE on internal SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_current_user_atendente() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_current_user_id_usuario() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_password_changed() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_atendente() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id_usuario() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_password_changed() TO authenticated;
