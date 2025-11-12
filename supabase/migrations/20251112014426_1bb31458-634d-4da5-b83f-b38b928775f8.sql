-- Normalize foreign keys to fix user deletion errors on chamados
-- Drop any existing FK constraints on chamados.id_solicitante and chamados.id_atendente
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'chamados'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name IN ('id_solicitante','id_atendente')
  ) LOOP
    EXECUTE format('ALTER TABLE public.chamados DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
END $$;

-- Recreate the desired constraints explicitly
ALTER TABLE public.chamados
  ADD CONSTRAINT fk_chamados_id_solicitante_cascade
  FOREIGN KEY (id_solicitante)
  REFERENCES public.usuario(id_usuario)
  ON DELETE CASCADE;

ALTER TABLE public.chamados
  ADD CONSTRAINT fk_chamados_id_atendente_setnull
  FOREIGN KEY (id_atendente)
  REFERENCES public.usuario(id_usuario)
  ON DELETE SET NULL;

-- Ensure attachments follow chamados deletion (avoid future orphan records)
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'chamadoanexo'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'id_chamado'
  ) LOOP
    EXECUTE format('ALTER TABLE public.chamadoanexo DROP CONSTRAINT %I', r.constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.chamadoanexo
  ADD CONSTRAINT fk_chamadoanexo_chamado
  FOREIGN KEY (id_chamado)
  REFERENCES public.chamados(id_chamado)
  ON DELETE CASCADE;