
CREATE TABLE public.agendamento (
  id_agendamento SERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES public.cliente(id_cliente) ON DELETE RESTRICT,
  numero_pedido TEXT NOT NULL,
  placa_veiculo TEXT,
  descricao_veiculo TEXT NOT NULL,
  carro_app BOOLEAN NOT NULL DEFAULT false,
  data_hora_agendamento TIMESTAMPTZ NOT NULL,
  id_usuario_criador INTEGER REFERENCES public.usuario(id_usuario) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamento TO authenticated;
GRANT ALL ON public.agendamento TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.agendamento_id_agendamento_seq TO authenticated;
GRANT ALL ON SEQUENCE public.agendamento_id_agendamento_seq TO service_role;

ALTER TABLE public.agendamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view agendamentos"
  ON public.agendamento FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert agendamentos"
  ON public.agendamento FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update agendamentos"
  ON public.agendamento FOR UPDATE
  TO authenticated USING (public.is_current_user_admin());

CREATE POLICY "Admins can delete agendamentos"
  ON public.agendamento FOR DELETE
  TO authenticated USING (public.is_current_user_admin());

CREATE INDEX idx_agendamento_data_hora ON public.agendamento(data_hora_agendamento);

CREATE OR REPLACE FUNCTION public.update_agendamento_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_agendamento_updated_at
  BEFORE UPDATE ON public.agendamento
  FOR EACH ROW EXECUTE FUNCTION public.update_agendamento_updated_at();

CREATE OR REPLACE FUNCTION public.check_agendamento_limit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.agendamento
  WHERE date_trunc('hour', data_hora_agendamento) = date_trunc('hour', NEW.data_hora_agendamento);
  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Horário lotado: já existem 5 agendamentos nesta hora.';
  END IF;
  IF NEW.data_hora_agendamento < now() THEN
    RAISE EXCEPTION 'Não é possível agendar em data/hora passada.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_agendamento_limit
  BEFORE INSERT ON public.agendamento
  FOR EACH ROW EXECUTE FUNCTION public.check_agendamento_limit();
