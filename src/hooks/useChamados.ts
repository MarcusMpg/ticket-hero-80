import { Chamado } from "@/types/chamado";

const normalize = (s: string | null | undefined) =>
  s ? s.toString().toLowerCase().replace(/\s+/g, "_") : "";

export function mapChamado(item: any): Chamado {
  return {
    id_chamado: item.id_chamado,
    titulo: item.titulo,
    descricao: item.descricao,
    status: normalize(item.status_chamado) as Chamado["status"],
    prioridade: normalize(item.prioridade) as Chamado["prioridade"],
    id_solicitante: item.id_solicitante,
    id_atendente: item.id_atendente,
    id_setor_origem: item.id_setor_origem,
    id_setor_destino: item.id_setor_destino,
    id_filial: item.id_filial,
    data_abertura: item.data_abertura,
    data_assumido: item.data_assumido,
    data_fechamento: item.data_fechamento,
    ultima_atualizacao: item.ultima_atualizacao,
    solicitante_nome: item.solicitante?.nome,
    atendente_nome: item.atendente?.nome,
    setor_origem_nome: item.setor_origem?.nome_setor,
    setor_destino_nome: item.setor_destino?.nome_setor,
  };
}

export const CHAMADOS_SELECT = `
  *,
  solicitante:usuario!fk_chamados_id_solicitante_cascade(nome),
  atendente:usuario!fk_chamados_id_atendente_setnull(nome),
  setor_origem:setor!chamados_id_setor_origem_fkey(nome_setor),
  setor_destino:setor!fk_chamados_setor(nome_setor)
`;
