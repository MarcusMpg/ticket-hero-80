-- Criar bucket para anexos de chamados
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chamado-anexos', 'chamado-anexos', false);

-- Política para usuários visualizarem anexos de seus próprios chamados
CREATE POLICY "Users can view anexos from their chamados"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chamado-anexos' AND
  (storage.foldername(name))[1] IN (
    SELECT id_chamado::text 
    FROM chamados 
    WHERE id_solicitante = get_current_user_id_usuario() 
       OR id_atendente = get_current_user_id_usuario()
       OR is_current_user_atendente()
  )
);

-- Política para usuários fazerem upload de anexos em seus chamados
CREATE POLICY "Users can upload anexos to their chamados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chamado-anexos' AND
  (storage.foldername(name))[1] IN (
    SELECT id_chamado::text 
    FROM chamados 
    WHERE id_solicitante = get_current_user_id_usuario()
  )
);

-- Política para usuários deletarem anexos de seus chamados
CREATE POLICY "Users can delete anexos from their chamados"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chamado-anexos' AND
  (storage.foldername(name))[1] IN (
    SELECT id_chamado::text 
    FROM chamados 
    WHERE id_solicitante = get_current_user_id_usuario()
  )
);