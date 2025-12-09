-- Adicionar coluna nome_usuario à tabela usuario
ALTER TABLE public.usuario 
ADD COLUMN nome_usuario character varying UNIQUE;

-- Atualizar registros existentes com nome_usuario baseado no email (parte antes do @)
UPDATE public.usuario 
SET nome_usuario = SPLIT_PART(email, '@', 1) 
WHERE nome_usuario IS NULL;

-- Tornar a coluna NOT NULL após preencher os dados existentes
ALTER TABLE public.usuario 
ALTER COLUMN nome_usuario SET NOT NULL;