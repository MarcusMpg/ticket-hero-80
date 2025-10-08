import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Chamado, Interacao } from "@/types/chamado";
import { ArrowLeft, User, Clock, MessageSquare } from "lucide-react";

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

export default function DetalheChamado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [novoStatus, setNovoStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChamado = async () => {
      try {
        // Mock de dados
        await new Promise((resolve) => setTimeout(resolve, 800));
        const mockChamado: Chamado = {
          id_chamado: Number(id),
          titulo: "Computador não liga",
          descricao: "O computador da minha estação não está ligando desde ontem. Já tentei verificar os cabos e a tomada, mas o problema persiste.",
          status: "em_andamento",
          prioridade: "alta",
          id_solicitante: 1,
          id_atendente: 2,
          id_setor_destino: 1,
          data_abertura: new Date(Date.now() - 86400000).toISOString(),
          data_fechamento: null,
          solicitante_nome: "João Silva",
          atendente_nome: "Carlos Santos",
        };

        const mockInteracoes: Interacao[] = [
          {
            id_interacao: 1,
            id_chamado: Number(id),
            id_funcionario: 1,
            tipo_interacao: "comentario",
            mensagem: "Chamado aberto pelo sistema.",
            data_interacao: new Date(Date.now() - 86400000).toISOString(),
            funcionario_nome: "João Silva",
          },
          {
            id_interacao: 2,
            id_chamado: Number(id),
            id_funcionario: 2,
            tipo_interacao: "atribuicao",
            mensagem: "Chamado assumido por Carlos Santos.",
            data_interacao: new Date(Date.now() - 82800000).toISOString(),
            funcionario_nome: "Carlos Santos",
          },
          {
            id_interacao: 3,
            id_chamado: Number(id),
            id_funcionario: 2,
            tipo_interacao: "comentario",
            mensagem: "Verificando o problema. Vou até sua estação em breve.",
            data_interacao: new Date(Date.now() - 82000000).toISOString(),
            funcionario_nome: "Carlos Santos",
          },
        ];

        setChamado(mockChamado);
        setInteracoes(mockInteracoes);
        setNovoStatus(mockChamado.status);
      } catch (error) {
        console.error("Erro ao carregar chamado:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do chamado.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChamado();
  }, [id, token, toast]);

  const handleAdicionarComentario = async () => {
    if (!novoComentario.trim()) return;

    try {
      // Simulação de API
      await new Promise((resolve) => setTimeout(resolve, 500));

      const novaInteracao: Interacao = {
        id_interacao: interacoes.length + 1,
        id_chamado: Number(id),
        id_funcionario: user?.id_funcionario || 1,
        tipo_interacao: "comentario",
        mensagem: novoComentario,
        data_interacao: new Date().toISOString(),
        funcionario_nome: user?.nome || "Usuário",
      };

      setInteracoes([...interacoes, novaInteracao]);
      setNovoComentario("");

      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi registrado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
    }
  };

  const handleAssumirChamado = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (chamado) {
        setChamado({
          ...chamado,
          id_atendente: user?.id_funcionario || 2,
          atendente_nome: user?.nome || "Atendente",
          status: "em_andamento",
        });
      }

      toast({
        title: "Chamado assumido",
        description: "Você agora é o responsável por este chamado.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível assumir o chamado.",
        variant: "destructive",
      });
    }
  };

  const handleMudarStatus = async () => {
    if (novoStatus === chamado?.status) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (chamado) {
        setChamado({
          ...chamado,
          status: novoStatus as Chamado['status'],
        });
      }

      toast({
        title: "Status atualizado",
        description: "O status do chamado foi alterado.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Carregando chamado...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!chamado) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground mb-4">Chamado não encontrado</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </MainLayout>
    );
  }

  const ehAtendente = user?.eh_atendente;
  const ehSolicitante = user?.id_funcionario === chamado.id_solicitante;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{chamado.titulo}</h1>
            <p className="text-sm text-muted-foreground">Chamado #{chamado.id_chamado}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{chamado.descricao}</p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Histórico de Interações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {interacoes.map((interacao) => (
                  <div key={interacao.id_interacao} className="border-l-2 border-primary pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{interacao.funcionario_nome}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(interacao.data_interacao)}
                      </span>
                    </div>
                    <p className="text-sm">{interacao.mensagem}</p>
                  </div>
                ))}

                <div className="pt-4 space-y-2">
                  <Textarea
                    placeholder="Adicione um comentário..."
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAdicionarComentario} disabled={!novoComentario.trim()}>
                    Adicionar Comentário
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant={statusConfig[chamado.status].variant}>
                    {statusConfig[chamado.status].label}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prioridade</p>
                  <Badge variant={prioridadeConfig[chamado.prioridade].variant}>
                    {prioridadeConfig[chamado.prioridade].label}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Solicitante</p>
                  <p className="text-sm font-medium">{chamado.solicitante_nome}</p>
                </div>

                {chamado.atendente_nome && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Atendente</p>
                    <p className="text-sm font-medium">{chamado.atendente_nome}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data de Abertura</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(chamado.data_abertura)}</span>
                  </div>
                </div>

                {chamado.data_fechamento && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data de Fechamento</p>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(chamado.data_fechamento)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {ehAtendente && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Ações do Atendente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!chamado.id_atendente && (
                    <Button className="w-full" onClick={handleAssumirChamado}>
                      Assumir Chamado
                    </Button>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Alterar Status</p>
                    <Select value={novoStatus} onValueChange={setNovoStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberto">Aberto</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="aguardando">Aguardando</SelectItem>
                        <SelectItem value="resolvido">Resolvido</SelectItem>
                        <SelectItem value="fechado">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleMudarStatus}
                      disabled={novoStatus === chamado.status}
                    >
                      Atualizar Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
