-- Habilitar REPLICA IDENTITY FULL para capturar todos os dados nas mudanças
ALTER TABLE public.chamados REPLICA IDENTITY FULL;

-- Adicionar tabela chamados à publicação supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chamados;