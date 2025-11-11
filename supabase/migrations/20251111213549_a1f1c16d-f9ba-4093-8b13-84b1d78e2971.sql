-- Remove a constraint existente
ALTER TABLE chamadoanexo 
DROP CONSTRAINT IF EXISTS fk_chamado_anexo;

-- Recria a constraint com ON DELETE CASCADE
ALTER TABLE chamadoanexo 
ADD CONSTRAINT fk_chamado_anexo 
FOREIGN KEY (id_chamado) 
REFERENCES chamados(id_chamado) 
ON DELETE CASCADE;