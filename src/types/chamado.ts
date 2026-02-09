export interface Chamado {
  id_chamado: number;
  titulo: string;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'aguardando' | 'concluido' | 'cancelado' | 'fechado';
  prioridade: 'baixa' | 'media' | 'alta';
  id_solicitante: number;
  id_atendente: number | null;
  id_setor_origem: number;
  id_setor_destino: number;
  id_filial: number;
  data_abertura: string;
  data_assumido: string | null;
  data_fechamento: string | null;
  ultima_atualizacao: string | null;
  solicitante_nome?: string;
  atendente_nome?: string | null;
  setor_origem_nome?: string;
  setor_destino_nome?: string;
}

export interface Interacao {
  id_interacao: number;
  id_chamado: number;
  id_funcionario: number;
  tipo_interacao: 'COMENTARIO' | 'MUDANCA_STATUS' | 'atribuicao' | 'comentario' | 'resolucao' | 'mudanca_status';
  mensagem: string;
  data_interacao: string;
  funcionario_nome?: string;
}
