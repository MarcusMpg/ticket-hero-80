-- Dropar constraint antiga primeiro
ALTER TABLE public.usuario DROP CONSTRAINT IF EXISTS usuario_tipo_usuario_check;

-- Atualizar registros existentes
UPDATE public.usuario SET tipo_usuario = 'USUARIO' WHERE tipo_usuario NOT IN ('USUARIO', 'ADMIN', 'DIRETOR');

-- Criar nova constraint
ALTER TABLE public.usuario ADD CONSTRAINT usuario_tipo_usuario_check 
  CHECK (tipo_usuario IN ('USUARIO', 'ADMIN', 'DIRETOR'));