-- Adicionar foreign keys faltantes na tabela chamados

-- Foreign key para id_solicitante
ALTER TABLE public.chamados
ADD CONSTRAINT chamados_id_solicitante_fkey
FOREIGN KEY (id_solicitante)
REFERENCES public.usuario(id_usuario)
ON DELETE RESTRICT;

-- Foreign key para id_atendente
ALTER TABLE public.chamados
ADD CONSTRAINT chamados_id_atendente_fkey
FOREIGN KEY (id_atendente)
REFERENCES public.usuario(id_usuario)
ON DELETE SET NULL;

-- Foreign key para id_setor
ALTER TABLE public.chamados
ADD CONSTRAINT chamados_id_setor_fkey
FOREIGN KEY (id_setor)
REFERENCES public.setor(id_setor)
ON DELETE RESTRICT;

-- Foreign key para id_filial
ALTER TABLE public.chamados
ADD CONSTRAINT chamados_id_filial_fkey
FOREIGN KEY (id_filial)
REFERENCES public.filial(id_filial)
ON DELETE RESTRICT;