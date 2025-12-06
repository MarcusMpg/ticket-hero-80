-- Add column to track if user must change password on first login
ALTER TABLE public.usuario 
ADD COLUMN IF NOT EXISTS deve_trocar_senha boolean NOT NULL DEFAULT true;

-- Update existing users to not require password change (they already have access)
UPDATE public.usuario SET deve_trocar_senha = false WHERE deve_trocar_senha = true;