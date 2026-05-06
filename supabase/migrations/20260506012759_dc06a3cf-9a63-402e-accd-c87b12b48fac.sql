ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS agendador boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS separador boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS modo_tv boolean NOT NULL DEFAULT false;

UPDATE public.usuario SET agendador = false WHERE agendador IS NULL;
UPDATE public.usuario SET separador = false WHERE separador IS NULL;
UPDATE public.usuario SET modo_tv = false WHERE modo_tv IS NULL;