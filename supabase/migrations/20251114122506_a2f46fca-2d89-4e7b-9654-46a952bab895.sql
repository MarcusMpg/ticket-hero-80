-- Add ON DELETE CASCADE to profiles foreign key
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_usuario_fkey;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_id_usuario_fkey 
  FOREIGN KEY (id_usuario) 
  REFERENCES public.usuario(id_usuario) 
  ON DELETE CASCADE;