-- Create a function to mark password as changed (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.mark_password_changed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_id_usuario integer;
BEGIN
  -- Get the current user's id_usuario
  SELECT p.id_usuario INTO current_id_usuario
  FROM public.profiles p
  WHERE p.id = auth.uid();
  
  IF current_id_usuario IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;
  
  -- Update the deve_trocar_senha flag
  UPDATE public.usuario
  SET deve_trocar_senha = false
  WHERE id_usuario = current_id_usuario;
END;
$$;