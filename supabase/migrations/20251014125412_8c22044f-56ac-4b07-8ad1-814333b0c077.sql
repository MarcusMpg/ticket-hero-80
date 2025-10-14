-- Vincular o profile existente ao usuario correspondente
UPDATE profiles 
SET id_usuario = 3
WHERE id = 'a462df0d-0c2b-40d0-b4e9-56f0609b7580' AND id_usuario IS NULL;