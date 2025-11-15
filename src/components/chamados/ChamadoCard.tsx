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

const statusConfig = {
  aberto: { label: "Aberto", variant: "info" as const },
  em_andamento: { label: "Em Andamento", variant: "warning" as const },
  aguardando: { label: "Aguardando", variant: "secondary" as const },
  concluido: { label: "Concluído", variant: "success" as const },
  fechado: { label: "Fechado", variant: "default" as const },
};

const prioridadeConfig = {
  baixa: { label: "Baixa", variant: "default" as const },
  media: { label: "Média", variant: "warning" as const },
  alta: { label: "Alta", variant: "destructive" as const },
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

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => navigate(`/chamado/${chamado.id_chamado}`)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
          <div className="flex-1 min-w-0 w-full">
            <h3 className="font-semibold text-base sm:text-lg truncate">{chamado.titulo}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{chamado.descricao}</p>
          </div>
          <Badge variant={prioridadeConfig[chamado.prioridade].variant} className="shrink-0">
            {prioridadeConfig[chamado.prioridade].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
          <Badge variant={statusConfig[chamado.status].variant}>
            {statusConfig[chamado.status].label}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
            <Clock className="h-4 w-4" />
            <span className="truncate">{formatDate(chamado.data_abertura)}</span>
          </div>
        </div>

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
