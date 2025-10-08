import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chamado } from "@/types/chamado";
import { Clock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChamadoCardProps {
  chamado: Chamado;
  showAtendente?: boolean;
}

const statusConfig = {
  aberto: { label: "Aberto", variant: "info" as const },
  em_andamento: { label: "Em Andamento", variant: "warning" as const },
  aguardando: { label: "Aguardando", variant: "secondary" as const },
  resolvido: { label: "Resolvido", variant: "success" as const },
  fechado: { label: "Fechado", variant: "default" as const },
};

const prioridadeConfig = {
  baixa: { label: "Baixa", variant: "default" as const },
  media: { label: "Média", variant: "warning" as const },
  alta: { label: "Alta", variant: "destructive" as const },
};

export const ChamadoCard = ({ chamado, showAtendente = false }: ChamadoCardProps) => {
  const navigate = useNavigate();

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
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{chamado.titulo}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{chamado.descricao}</p>
          </div>
          <Badge variant={prioridadeConfig[chamado.prioridade].variant}>
            {prioridadeConfig[chamado.prioridade].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={statusConfig[chamado.status].variant}>
            {statusConfig[chamado.status].label}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDate(chamado.data_abertura)}</span>
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

        <Button variant="outline" size="sm" className="w-full">
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};
