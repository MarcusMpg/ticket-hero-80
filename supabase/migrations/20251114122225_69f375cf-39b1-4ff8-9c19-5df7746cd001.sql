-- Add ON DELETE CASCADE to interacao foreign key
ALTER TABLE public.interacao 
  DROP CONSTRAINT IF EXISTS fk_interacao_chamado;

ALTER TABLE public.interacao 
  ADD CONSTRAINT fk_interacao_chamado 
  FOREIGN KEY (id_chamado) 
  REFERENCES public.chamados(id_chamado) 
  ON DELETE CASCADE;

-- Add ON DELETE CASCADE to chamadoanexo foreign key as well
ALTER TABLE public.chamadoanexo 
  DROP CONSTRAINT IF EXISTS fk_chamadoanexo_chamado;

ALTER TABLE public.chamadoanexo 
  ADD CONSTRAINT fk_chamadoanexo_chamado 
  FOREIGN KEY (id_chamado) 
  REFERENCES public.chamados(id_chamado) 
  ON DELETE CASCADE;