
-- Adicionar colunas de auditoria na tabela chamados
ALTER TABLE public.chamados 
  ADD COLUMN IF NOT EXISTS data_assumido TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Adicionar status CANCELADO ao fluxo
-- (Não é necessário constraint pois status_chamado é varchar)

-- Atualizar RLS para DIRETOR poder ver todos os chamados (já existe a policy "Diretores e Admins veem tudo")
-- Verificar se a policy está correta - ela já inclui DIRETOR

-- Garantir que o trigger de status existe
DROP TRIGGER IF EXISTS trg_processa_mudanca_status ON public.chamados;
CREATE TRIGGER trg_processa_mudanca_status
  BEFORE UPDATE ON public.chamados
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_processa_mudanca_status();
