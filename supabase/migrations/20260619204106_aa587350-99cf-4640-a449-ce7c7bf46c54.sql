
-- 1. Audit log table
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id TEXT,
  id_chamado INTEGER,
  id_usuario INTEGER,
  auth_uid UUID,
  valores_antigos JSONB,
  valores_novos JSONB,
  detalhes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_chamado ON public.audit_log(id_chamado);
CREATE INDEX idx_audit_log_tabela_acao ON public.audit_log(tabela, acao);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas admins podem visualizar logs"
ON public.audit_log FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

-- Sem políticas de INSERT/UPDATE/DELETE: apenas triggers SECURITY DEFINER escrevem

-- 2. Trigger function: chamados (status + designação)
CREATE OR REPLACE FUNCTION public.fn_audit_chamados()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_usuario INTEGER;
BEGIN
  v_id_usuario := public.get_current_user_id_usuario();

  IF OLD.status_chamado IS DISTINCT FROM NEW.status_chamado THEN
    INSERT INTO public.audit_log (acao, tabela, registro_id, id_chamado, id_usuario, auth_uid, valores_antigos, valores_novos, detalhes)
    VALUES (
      'STATUS_ALTERADO', 'chamados', NEW.id_chamado::TEXT, NEW.id_chamado, v_id_usuario, auth.uid(),
      jsonb_build_object('status_chamado', OLD.status_chamado),
      jsonb_build_object('status_chamado', NEW.status_chamado),
      'Status alterado de ' || OLD.status_chamado || ' para ' || NEW.status_chamado
    );
  END IF;

  IF OLD.id_atendente IS DISTINCT FROM NEW.id_atendente THEN
    INSERT INTO public.audit_log (acao, tabela, registro_id, id_chamado, id_usuario, auth_uid, valores_antigos, valores_novos, detalhes)
    VALUES (
      'DESIGNACAO_ALTERADA', 'chamados', NEW.id_chamado::TEXT, NEW.id_chamado, v_id_usuario, auth.uid(),
      jsonb_build_object('id_atendente', OLD.id_atendente),
      jsonb_build_object('id_atendente', NEW.id_atendente),
      'Atendente alterado de ' || COALESCE(OLD.id_atendente::TEXT, 'NULL') || ' para ' || COALESCE(NEW.id_atendente::TEXT, 'NULL')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_chamados ON public.chamados;
CREATE TRIGGER trg_audit_chamados
AFTER UPDATE ON public.chamados
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_chamados();

-- 3. Trigger function: chamadoanexo (uploads e updates)
CREATE OR REPLACE FUNCTION public.fn_audit_chamadoanexo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_usuario INTEGER;
BEGIN
  v_id_usuario := public.get_current_user_id_usuario();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (acao, tabela, registro_id, id_chamado, id_usuario, auth_uid, valores_novos, detalhes)
    VALUES (
      'ANEXO_UPLOAD', 'chamadoanexo', NEW.id_anexo::TEXT, NEW.id_chamado, v_id_usuario, auth.uid(),
      jsonb_build_object('nome_original', NEW.nome_original, 'mime_type', NEW.mime_type, 'caminho_servidor', NEW.caminho_servidor),
      'Anexo enviado: ' || NEW.nome_original
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (acao, tabela, registro_id, id_chamado, id_usuario, auth_uid, valores_antigos, valores_novos, detalhes)
    VALUES (
      'ANEXO_ATUALIZADO', 'chamadoanexo', NEW.id_anexo::TEXT, NEW.id_chamado, v_id_usuario, auth.uid(),
      to_jsonb(OLD), to_jsonb(NEW),
      'Anexo atualizado: ' || NEW.nome_original
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (acao, tabela, registro_id, id_chamado, id_usuario, auth_uid, valores_antigos, detalhes)
    VALUES (
      'ANEXO_REMOVIDO', 'chamadoanexo', OLD.id_anexo::TEXT, OLD.id_chamado, v_id_usuario, auth.uid(),
      to_jsonb(OLD),
      'Anexo removido: ' || OLD.nome_original
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_chamadoanexo ON public.chamadoanexo;
CREATE TRIGGER trg_audit_chamadoanexo
AFTER INSERT OR UPDATE OR DELETE ON public.chamadoanexo
FOR EACH ROW
EXECUTE FUNCTION public.fn_audit_chamadoanexo();

-- Revoga execução pública das funções de audit (são chamadas só por triggers)
REVOKE EXECUTE ON FUNCTION public.fn_audit_chamados() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_audit_chamadoanexo() FROM PUBLIC, anon, authenticated;
