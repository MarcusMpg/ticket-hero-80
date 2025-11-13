import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Chamado, Interacao } from "@/types/chamado";
import { ArrowLeft, User, Clock, MessageSquare, Trash2, Paperclip, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

export default function DetalheChamado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [novoStatus, setNovoStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChamado = async () => {
      if (!id) return;
      
      try {
        // Fetch chamado
        const { data: chamadoData, error: chamadoError } = await supabase
          .from('chamados')
          .select(`
            *,
            solicitante:usuario!fk_chamados_id_solicitante_cascade(nome),
            atendente:usuario!fk_chamados_id_atendente_setnull(nome)
          `)
          .eq('id_chamado', Number(id))
          .single();

        if (chamadoError) throw chamadoError;

        const normalize = (s: string | null | undefined) =>
          s ? s.toString().toLowerCase().replace(/\s+/g, "_") : "";

        const statusNorm = normalize(chamadoData.status_chamado) as Chamado["status"];
        const prioridadeNorm = normalize(chamadoData.prioridade) as Chamado["prioridade"];

        const chamadoMapeado: Chamado = {
          id_chamado: chamadoData.id_chamado,
          titulo: chamadoData.titulo,
          descricao: chamadoData.descricao,
          status: statusNorm,
          prioridade: prioridadeNorm,
          id_solicitante: chamadoData.id_solicitante,
          id_atendente: chamadoData.id_atendente,
          id_setor_destino: chamadoData.id_setor,
          data_abertura: chamadoData.data_abertura,
          data_fechamento: chamadoData.data_fechamento,
          solicitante_nome: (chamadoData.solicitante as any)?.[0]?.nome,
          atendente_nome: (chamadoData.atendente as any)?.[0]?.nome,
        };

        setChamado(chamadoMapeado);
        setNovoStatus(chamadoMapeado.status);

        // Fetch anexos
        const { data: anexosData, error: anexosError } = await supabase
          .from('chamadoanexo')
          .select('*')
          .eq('id_chamado', Number(id))
          .order('data_upload', { ascending: true });

        if (anexosError) throw anexosError;
        setAnexos(anexosData || []);

        // Fetch interacoes
        const { data: interacoesData, error: interacoesError } = await supabase
          .from('interacao')
          .select(`
            *,
            usuario(nome)
          `)
          .eq('id_chamado', Number(id))
          .order('data_interacao', { ascending: true });

        if (interacoesError) throw interacoesError;

        const interacoesMapeadas: Interacao[] = (interacoesData || []).map((item: any) => ({
          id_interacao: item.id_interacao,
          id_chamado: item.id_chamado,
          id_funcionario: item.id_usuario,
          tipo_interacao: item.tipo_interacao as any,
          mensagem: item.conteudo,
          data_interacao: item.data_interacao,
          funcionario_nome: item.usuario?.nome,
        }));

        setInteracoes(interacoesMapeadas);
      } catch (error: any) {
        console.error("Erro ao carregar chamado:", error);
        toast({
          title: "Erro",
          description: error.message || "Não foi possível carregar os detalhes do chamado.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChamado();
  }, [id, toast]);

  const handleAdicionarComentario = async () => {
    if (!novoComentario.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('interacao')
        .insert({
          id_chamado: Number(id),
          id_usuario: user.id_usuario,
          tipo_interacao: 'COMENTARIO',
          conteudo: novoComentario,
        })
        .select(`
          *,
          usuario(nome)
        `)
        .single();

      if (error) throw error;

      const novaInteracao: Interacao = {
        id_interacao: data.id_interacao,
        id_chamado: data.id_chamado,
        id_funcionario: data.id_usuario,
        tipo_interacao: data.tipo_interacao as any,
        mensagem: data.conteudo,
        data_interacao: data.data_interacao,
        funcionario_nome: (data as any).usuario?.nome,
      };

      setInteracoes([...interacoes, novaInteracao]);
      setNovoComentario("");

      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi registrado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
    }
  };

  const handleAssumirChamado = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('chamados')
        .update({
          id_atendente: user.id_usuario,
          status_chamado: 'EM_ANDAMENTO',
        })
        .eq('id_chamado', Number(id));

      if (error) throw error;

      if (chamado) {
        setChamado({
          ...chamado,
          id_atendente: user.id_usuario,
          atendente_nome: user.nome,
          status: "em_andamento",
        });
        setNovoStatus("em_andamento");
      }

      toast({
        title: "Chamado assumido",
        description: "Você agora é o responsável por este chamado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível assumir o chamado.",
        variant: "destructive",
      });
    }
  };

  const handleMudarStatus = async () => {
    if (novoStatus === chamado?.status) return;

    try {
      const { error } = await supabase
        .from('chamados')
        .update({ status_chamado: novoStatus.toUpperCase() })
        .eq('id_chamado', Number(id));

      if (error) throw error;

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
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const handleDeletarChamado = async () => {
    try {
      const { error } = await supabase
        .from('chamados')
        .delete()
        .eq('id_chamado', Number(id));

      if (error) throw error;

      toast({
        title: "Chamado deletado",
        description: "O chamado foi removido com sucesso.",
      });

      // Redirecionar para a lista de chamados
      navigate(ehAtendente ? '/painel-ti' : '/meus-chamados');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível deletar o chamado.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAnexo = async (anexo: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('chamado-anexos')
        .download(anexo.caminho_servidor);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = anexo.nome_original;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível baixar o arquivo.",
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

  const ehAtendente = user?.eh_atendente || user?.eh_admin;
  const ehSolicitante = user?.id_usuario === chamado.id_solicitante;
  const podeDeletear = user?.eh_admin || (ehSolicitante && chamado.status === 'aberto');

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{chamado.titulo}</h1>
              <p className="text-sm text-muted-foreground">Chamado #{chamado.id_chamado}</p>
            </div>
          </div>
          
          {podeDeletear && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Chamado
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar este chamado? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletarChamado}>
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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

            {anexos.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Anexos ({anexos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {anexos.map((anexo) => (
                      <div
                        key={anexo.id_anexo}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{anexo.nome_original}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadAnexo(anexo)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                        {novoStatus === "concluido" || chamado.status === "concluido" ? (
                          <>
                            <SelectItem value="concluido">Concluído</SelectItem>
                            <SelectItem value="fechado">Fechado</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="aberto">Aberto</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="aguardando">Aguardando</SelectItem>
                            <SelectItem value="concluido">Concluído</SelectItem>
                            <SelectItem value="fechado">Fechado</SelectItem>
                          </>
                        )}
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
