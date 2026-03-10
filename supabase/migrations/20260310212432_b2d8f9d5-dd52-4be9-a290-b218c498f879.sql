
-- 1. Criar tabela tipo_chamado
CREATE TABLE public.tipo_chamado (
  id_tipo_chamado SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL UNIQUE,
  requer_aprovacao_diretoria BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.tipo_chamado ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para tipo_chamado
CREATE POLICY "Authenticated users can view active tipos"
  ON public.tipo_chamado FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert tipos"
  ON public.tipo_chamado FOR INSERT TO authenticated
  WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can update tipos"
  ON public.tipo_chamado FOR UPDATE TO authenticated
  USING (is_current_user_admin());

CREATE POLICY "Admins can delete tipos"
  ON public.tipo_chamado FOR DELETE TO authenticated
  USING (is_current_user_admin());

-- 4. Adicionar colunas ao chamados para tipo e aprovação
ALTER TABLE public.chamados
  ADD COLUMN id_tipo_chamado INTEGER REFERENCES public.tipo_chamado(id_tipo_chamado),
  ADD COLUMN aprovacao_diretoria VARCHAR(20) DEFAULT NULL,
  ADD COLUMN id_aprovador INTEGER REFERENCES public.usuario(id_usuario),
  ADD COLUMN data_aprovacao TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN motivo_recusa TEXT DEFAULT NULL;

-- 5. Constraint para valores de aprovação
ALTER TABLE public.chamados
  ADD CONSTRAINT chamados_aprovacao_check
  CHECK (aprovacao_diretoria IS NULL OR aprovacao_diretoria IN ('PENDENTE', 'APROVADO', 'RECUSADO'));
