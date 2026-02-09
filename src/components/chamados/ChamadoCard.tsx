import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chamado } from "@/types/chamado";
import { Clock, User, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChamadoCardProps {
  chamado: Chamado;
  showAtendente?: boolean;
  onAssumirChamado?: (chamadoId: number) => void;
  isAtendente?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "info" | "warning" | "secondary" | "success" | "destructive" | "default" }> = {
  aberto: { label: "Aberto", variant: "info" },
  em_andamento: { label: "Em Andamento", variant: "warning" },
  aguardando: { label: "Aguardando", variant: "secondary" },
  concluido: { label: "Concluído", variant: "success" },
  cancelado: { label: "Cancelado", variant: "destructive" },
  fechado: { label: "Fechado", variant: "default" },
};

const prioridadeConfig: Record<string, { label: string; variant: "default" | "warning" | "destructive" }> = {
  baixa: { label: "Baixa", variant: "default" },
  media: { label: "Média", variant: "warning" },
  alta: { label: "Alta", variant: "destructive" },
};

export const ChamadoCard = ({ 
  chamado, 
  showAtendente = false, 
  onAssumirChamado,
  isAtendente = false 
}: ChamadoCardProps) => {
  const navigate = useNavigate();

  const handleAssumirClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAssumirChamado) {
      onAssumirChamado(chamado.id_chamado);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusInfo = statusConfig[chamado.status] || statusConfig.aberto;
  const prioridadeInfo = prioridadeConfig[chamado.prioridade] || prioridadeConfig.baixa;

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => navigate(`/chamado/${chamado.id_chamado}`)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
          <div className="flex-1 min-w-0 w-full">
            <h3 className="font-semibold text-base sm:text-lg truncate">{chamado.titulo}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{chamado.descricao}</p>
          </div>
          <Badge variant={prioridadeInfo.variant} className="shrink-0">
            {prioridadeInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
          <Badge variant={statusInfo.variant}>
            {statusInfo.label}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
            <Clock className="h-4 w-4" />
            <span className="truncate">{formatDate(chamado.data_abertura)}</span>
          </div>
        </div>

        {(chamado.setor_origem_nome || chamado.setor_destino_nome) && (
          <div className="text-xs text-muted-foreground">
            {chamado.setor_origem_nome && <span>{chamado.setor_origem_nome}</span>}
            {chamado.setor_origem_nome && chamado.setor_destino_nome && <span> → </span>}
            {chamado.setor_destino_nome && <span className="font-medium">{chamado.setor_destino_nome}</span>}
          </div>
        )}

        {showAtendente && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{chamado.solicitante_nome || "Usuário Desconhecido"}</span>
          </div>
        )}

        {chamado.atendente_nome && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium">Atendente: {chamado.atendente_nome}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {isAtendente && !chamado.id_atendente && chamado.status === 'aberto' && (
            <Button 
              variant="default" 
              size="sm" 
              className="w-full sm:flex-1"
              onClick={handleAssumirClick}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Assumir Chamado</span>
              <span className="sm:hidden">Assumir</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className={isAtendente && !chamado.id_atendente && chamado.status === 'aberto' ? 'w-full sm:flex-1' : 'w-full'}
            onClick={() => navigate(`/chamado/${chamado.id_chamado}`)}
          >
            Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
