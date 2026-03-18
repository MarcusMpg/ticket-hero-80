import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { ShieldCheck, CheckCircle, XCircle, Clock, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChamadoPendente {
  id_chamado: number;
  titulo: string;
  descricao: string;
  prioridade: string;
  data_abertura: string;
  solicitante_nome?: string;
  setor_origem_nome?: string;
  setor_destino_nome?: string;
  tipo_chamado_nome?: string;
}

export default function AprovacoesDiretoria() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendentes, setPendentes] = useState<ChamadoPendente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState<ChamadoPendente | null>(null);
  const [acao, setAcao] = useState<"APROVADO" | "RECUSADO">("APROVADO");
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPendentes = async () => {
    try {
      const { data, error } = await supabase
        .from("chamados")
        .select(`
          id_chamado, titulo, descricao, prioridade, data_abertura,
          solicitante:usuario!fk_chamados_id_solicitante_cascade(nome),
          setor_origem:setor!chamados_id_setor_origem_fkey(nome_setor),
          setor_destino:setor!fk_chamados_setor(nome_setor),
          tipo_chamado:tipo_chamado(nome)
        `)
        .eq("aprovacao_diretoria", "PENDENTE")
        .order("data_abertura", { ascending: true });

      if (error) throw error;

      setPendentes(
        (data || []).map((item: any) => ({
          id_chamado: item.id_chamado,
          titulo: item.titulo,
          descricao: item.descricao,
          prioridade: item.prioridade,
          data_abertura: item.data_abertura,
          solicitante_nome: item.solicitante?.nome,
          setor_origem_nome: item.setor_origem?.nome_setor,
          setor_destino_nome: item.setor_destino?.nome_setor,
          tipo_chamado_nome: item.tipo_chamado?.nome,
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar aprovações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendentes();

    const channel = supabase
      .channel("aprovacoes-diretoria")
      .on("postgres_changes", { event: "*", schema: "public", table: "chamados" }, () => {
        fetchPendentes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!user?.eh_diretor && !user?.eh_admin) {
    return <Navigate to="/abrir-chamado" replace />;
  }

  const handleAcao = (chamado: ChamadoPendente, tipo: "APROVADO" | "RECUSADO") => {
    setSelectedChamado(chamado);
    setAcao(tipo);
    setMotivo("");
    setDialogOpen(true);
  };

  const handleConfirmar = async () => {
    if (!selectedChamado || !user) return;
    if (acao === "RECUSADO" && !motivo.trim()) {
      toast({ title: "Motivo obrigatório", description: "Informe o motivo da recusa.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: any = {
        aprovacao_diretoria: acao,
        id_aprovador: user.id_usuario,
        data_aprovacao: new Date().toISOString(),
      };

      if (acao === "RECUSADO") {
        updateData.motivo_recusa = motivo;
        updateData.status_chamado = "CANCELADO";
      }

      const { error } = await supabase
        .from("chamados")
        .update(updateData)
        .eq("id_chamado", selectedChamado.id_chamado);

      if (error) throw error;

      // Registrar interação
      await supabase.from("interacao").insert({
        id_chamado: selectedChamado.id_chamado,
        id_usuario: user.id_usuario,
        tipo_interacao: "MUDANCA_STATUS",
        conteudo: acao === "APROVADO"
          ? `Chamado aprovado pela diretoria por ${user.nome}`
          : `Chamado recusado pela diretoria por ${user.nome}. Motivo: ${motivo}`,
      });

      toast({
        title: acao === "APROVADO" ? "Chamado aprovado!" : "Chamado recusado",
        description: acao === "APROVADO"
          ? "O chamado agora pode ser assumido por um atendente."
          : "O chamado foi cancelado.",
      });

      setDialogOpen(false);
      await fetchPendentes();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const prioridadeConfig: Record<string, { label: string; variant: "default" | "warning" | "destructive" | "info" }> = {
    BAIXA: { label: "Baixa - 72h a 120h", variant: "info" },
    MEDIA: { label: "Média - 24h a 48h", variant: "warning" },
    ALTA: { label: "Alta - 4h a 8h", variant: "destructive" },
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Carregando aprovações...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            Aprovações da Diretoria
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Chamados que necessitam de aprovação antes de serem atendidos
          </p>
        </div>

        {pendentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground">Nenhuma aprovação pendente</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendentes.map((chamado) => (
              <Card key={chamado.id_chamado} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{chamado.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{chamado.descricao}</p>
                    </div>
                    <Badge variant={prioridadeVariant[chamado.prioridade] || "default"} className="shrink-0">
                      {chamado.prioridade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {chamado.tipo_chamado_nome && (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <ShieldCheck className="h-3 w-3" />
                      {chamado.tipo_chamado_nome}
                    </Badge>
                  )}

                  <div className="text-xs text-muted-foreground space-y-1">
                    {chamado.solicitante_nome && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {chamado.solicitante_nome}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(chamado.data_abertura)}
                    </div>
                    {chamado.setor_origem_nome && chamado.setor_destino_nome && (
                      <div>{chamado.setor_origem_nome} → {chamado.setor_destino_nome}</div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAcao(chamado, "APROVADO")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleAcao(chamado, "RECUSADO")}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Recusar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acao === "APROVADO" ? "Aprovar chamado" : "Recusar chamado"}
            </DialogTitle>
            <DialogDescription>
              {acao === "APROVADO"
                ? `Deseja aprovar o chamado "${selectedChamado?.titulo}"? Ele ficará disponível para atendimento.`
                : `Informe o motivo da recusa do chamado "${selectedChamado?.titulo}".`}
            </DialogDescription>
          </DialogHeader>

          {acao === "RECUSADO" && (
            <Textarea
              placeholder="Motivo da recusa..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={500}
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              variant={acao === "APROVADO" ? "default" : "destructive"}
              onClick={handleConfirmar}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processando..." : acao === "APROVADO" ? "Confirmar Aprovação" : "Confirmar Recusa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
