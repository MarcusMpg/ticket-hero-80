-- Add missing id_setor column to public.usuario and foreign key to public.setor
-- This fixes edge function failures expecting this column

-- 1) Add column if it doesn't exist (nullable to avoid breaking existing rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usuario'
      AND column_name = 'id_setor'
  ) THEN
    ALTER TABLE public.usuario
      ADD COLUMN id_setor integer;
  END IF;
END $$;

-- 2) Add foreign key constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usuario_id_setor_fkey'
  ) THEN
    ALTER TABLE public.usuario
      ADD CONSTRAINT usuario_id_setor_fkey
      FOREIGN KEY (id_setor)
      REFERENCES public.setor (id_setor)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3) Helpful index for joins/filters
CREATE INDEX IF NOT EXISTS idx_usuario_id_setor ON public.usuario(id_setor);
