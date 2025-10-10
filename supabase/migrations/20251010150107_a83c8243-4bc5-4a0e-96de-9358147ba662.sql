-- Enable RLS on all tables
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamadoanexo ENABLE ROW LEVEL SECURITY;

-- Create profiles table linked to Supabase auth
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id_usuario INTEGER UNIQUE REFERENCES public.usuario(id_usuario),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to get current user's id_usuario
CREATE OR REPLACE FUNCTION public.get_current_user_id_usuario()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.id_usuario 
  FROM public.profiles p 
  WHERE p.id = auth.uid()
$$;

-- Helper function to check if current user is atendente
CREATE OR REPLACE FUNCTION public.is_current_user_atendente()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuario u
    JOIN public.profiles p ON p.id_usuario = u.id_usuario
    WHERE p.id = auth.uid() AND u.tipo_usuario = 'atendente'
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for usuario (read-only for authenticated users)
CREATE POLICY "Authenticated users can view usuarios"
  ON public.usuario FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for setor (read-only for authenticated users)
CREATE POLICY "Authenticated users can view setores"
  ON public.setor FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for filial (read-only for authenticated users)
CREATE POLICY "Authenticated users can view filiais"
  ON public.filial FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for chamados
CREATE POLICY "Users can view own chamados"
  ON public.chamados FOR SELECT
  TO authenticated
  USING (
    id_solicitante = public.get_current_user_id_usuario()
    OR id_atendente = public.get_current_user_id_usuario()
    OR public.is_current_user_atendente()
  );

CREATE POLICY "Users can insert own chamados"
  ON public.chamados FOR INSERT
  TO authenticated
  WITH CHECK (id_solicitante = public.get_current_user_id_usuario());

CREATE POLICY "Users can update chamados"
  ON public.chamados FOR UPDATE
  TO authenticated
  USING (
    id_solicitante = public.get_current_user_id_usuario()
    OR public.is_current_user_atendente()
  );

-- RLS Policies for interacao
CREATE POLICY "Users can view interacoes from their chamados"
  ON public.interacao FOR SELECT
  TO authenticated
  USING (
    id_chamado IN (
      SELECT c.id_chamado 
      FROM public.chamados c
      WHERE c.id_solicitante = public.get_current_user_id_usuario()
        OR c.id_atendente = public.get_current_user_id_usuario()
        OR public.is_current_user_atendente()
    )
  );

CREATE POLICY "Users can insert interacoes"
  ON public.interacao FOR INSERT
  TO authenticated
  WITH CHECK (id_usuario = public.get_current_user_id_usuario());

-- RLS Policies for chamadoanexo
CREATE POLICY "Users can view anexos from their chamados"
  ON public.chamadoanexo FOR SELECT
  TO authenticated
  USING (
    id_chamado IN (
      SELECT c.id_chamado 
      FROM public.chamados c
      WHERE c.id_solicitante = public.get_current_user_id_usuario()
        OR c.id_atendente = public.get_current_user_id_usuario()
        OR public.is_current_user_atendente()
    )
  );

CREATE POLICY "Users can insert anexos to their chamados"
  ON public.chamadoanexo FOR INSERT
  TO authenticated
  WITH CHECK (
    id_chamado IN (
      SELECT c.id_chamado 
      FROM public.chamados c
      WHERE c.id_solicitante = public.get_current_user_id_usuario()
    )
  );