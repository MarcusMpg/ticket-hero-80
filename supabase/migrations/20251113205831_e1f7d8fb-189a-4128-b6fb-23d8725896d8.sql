-- Update status constraint to allow AGUARDANDO status
ALTER TABLE public.chamados DROP CONSTRAINT IF EXISTS chk_status_chamado;
ALTER TABLE public.chamados
  ADD CONSTRAINT chk_status_chamado
  CHECK (status_chamado IN (
    'ABERTO',
    'EM_ANDAMENTO',
    'AGUARDANDO',
    'CONCLUIDO',
    'FECHADO',
    'CANCELADO'
  ));