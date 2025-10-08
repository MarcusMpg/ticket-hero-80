export interface Chamado {
  id_chamado: number;
  titulo: string;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'aguardando' | 'resolvido' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta';
  id_solicitante: number;
  id_atendente: number | null;
  id_setor_destino: number;
  data_abertura: string;
  data_fechamento: string | null;
  solicitante_nome?: string;
  atendente_nome?: string | null;
}

export interface Interacao {
  id_interacao: number;
  id_chamado: number;
  id_funcionario: number;
  tipo_interacao: 'comentario' | 'resolucao' | 'atribuicao' | 'mudanca_status';
  mensagem: string;
  data_interacao: string;
  funcionario_nome?: string;
}
