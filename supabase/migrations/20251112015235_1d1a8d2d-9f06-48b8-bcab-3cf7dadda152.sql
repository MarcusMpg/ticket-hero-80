-- Fix RLS policy to allow atendentes/admins to see all chamados

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view own chamados" ON public.chamados;

-- Create a clearer policy: users see their own chamados, atendentes/admins see all
CREATE POLICY "Users can view chamados based on role" 
ON public.chamados 
FOR SELECT 
USING (
  -- User is the requester
  (id_solicitante = get_current_user_id_usuario())
  OR
  -- User is the assigned attendant
  (id_atendente = get_current_user_id_usuario())
  OR
  -- User is an atendente or admin (can see all chamados)
  is_current_user_atendente()
);