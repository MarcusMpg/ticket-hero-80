-- Fix foreign key constraints on chamados table to allow user deletion

-- First, we need to find and drop the existing foreign key constraints
-- The constraint names might vary, so we'll use a safe approach

-- Drop existing foreign key on id_solicitante if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_chamados_solicitante' 
    AND table_name = 'chamados'
  ) THEN
    ALTER TABLE public.chamados DROP CONSTRAINT fk_chamados_solicitante;
  END IF;
END $$;

-- Drop existing foreign key on id_atendente if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_chamados_atendente' 
    AND table_name = 'chamados'
  ) THEN
    ALTER TABLE public.chamados DROP CONSTRAINT fk_chamados_atendente;
  END IF;
END $$;

-- Drop existing foreign key on id_filial if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_chamados_filial' 
    AND table_name = 'chamados'
  ) THEN
    ALTER TABLE public.chamados DROP CONSTRAINT fk_chamados_filial;
  END IF;
END $$;

-- Drop existing foreign key on id_setor if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_chamados_setor' 
    AND table_name = 'chamados'
  ) THEN
    ALTER TABLE public.chamados DROP CONSTRAINT fk_chamados_setor;
  END IF;
END $$;

-- Now add the foreign keys with proper ON DELETE actions
-- When a solicitante (requester) is deleted, cascade delete their chamados
ALTER TABLE public.chamados 
  ADD CONSTRAINT fk_chamados_solicitante 
  FOREIGN KEY (id_solicitante) 
  REFERENCES public.usuario(id_usuario) 
  ON DELETE CASCADE;

-- When an atendente (attendant) is deleted, set the field to NULL (chamado can exist without assigned attendant)
ALTER TABLE public.chamados 
  ADD CONSTRAINT fk_chamados_atendente 
  FOREIGN KEY (id_atendente) 
  REFERENCES public.usuario(id_usuario) 
  ON DELETE SET NULL;

-- Add foreign keys for filial and setor with proper actions
ALTER TABLE public.chamados 
  ADD CONSTRAINT fk_chamados_filial 
  FOREIGN KEY (id_filial) 
  REFERENCES public.filial(id_filial) 
  ON DELETE RESTRICT;

ALTER TABLE public.chamados 
  ADD CONSTRAINT fk_chamados_setor 
  FOREIGN KEY (id_setor) 
  REFERENCES public.setor(id_setor) 
  ON DELETE RESTRICT;