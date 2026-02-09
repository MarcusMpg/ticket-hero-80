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
import { ArrowLeft, User, Clock, MessageSquare, Trash2, Paperclip, Download, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mapChamado, CHAMADOS_SELECT } from "@/hooks/useChamados";

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
  const [justificativa, setJustificativa] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadChamado = async () => {
    if (!id) return null;
    const { data, error } = await supabase
      .from('chamados')
      .select(CHAMADOS_SELECT)
      .eq('id_chamado', Number(id))
      .single();
    if (error) throw error;
    return mapChamado(data);
  };

  const loadInteracoes = async () => {
    if (!id) return [];
    const { data, error } = await supabase
      .from('interacao')
      .select('*, usuario(nome)')
      .eq('id_chamado', Number(id))
      .order('data_interacao', { ascending: true });
    if (error) throw error;
    return (data || []).map((item: any): Interacao => ({
      id_interacao: item.id_interacao,
      id_chamado: item.id_chamado,
      id_funcionario: item.id_usuario,
      tipo_interacao: item.tipo_interacao,
      mensagem: item.conteudo,
      data_interacao: item.data_interacao,
      funcionario_nome: item.usuario?.nome,
    }));
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [chamadoData, interacoesData, anexosRes] = await Promise.all([
          loadChamado(),
          loadInteracoes(),
          supabase.from('chamadoanexo').select('*').eq('id_chamado', Number(id)).order('data_upload', { ascending: true }),
        ]);

        setChamado(chamadoData);
        setNovoStatus(chamadoData?.status || "");
        setInteracoes(interacoesData);
        setAnexos(anexosRes.data || []);
        setIsInitialLoad(false);
      } catch (error: any) {
        console.error("Erro ao carregar chamado:", error);
        toast({ title: "Erro", description: error.message || "Não foi possível carregar os detalhes.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();

    if (!id) return;

    const channel = supabase
      .channel(`chamado-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chamados', filter: `id_chamado=eq.${id}` }, async (payload) => {
        try {
          const c = await loadChamado();
          if (c) { setChamado(c); setNovoStatus(c.status); }
          if (!isInitialLoad && payload.eventType === 'UPDATE') toast({ title: "Chamado atualizado", description: "Este chamado foi atualizado" });
        } catch {}
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interacao', filter: `id_chamado=eq.${id}` }, async (payload) => {
        try {
          const i = await loadInteracoes();
          setInteracoes(i);
          if (!isInitialLoad && payload.eventType === 'INSERT') toast({ title: "Nova interação", description: "Um novo comentário foi adicionado" });
        } catch {}
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, toast]);

  const handleAdicionarComentario = async () => {
    if (!novoComentario.trim() || !user) return;
    try {
      await supabase.from('interacao').insert({
        id_chamado: Number(id),
        id_usuario: user.id_usuario,
        tipo_interacao: 'COMENTARIO',
        conteudo: novoComentario,
      });
      setNovoComentario("");
      toast({ title: "Comentário adicionado", description: "Seu comentário foi registrado." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleAssumirChamado = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('chamados')
        .update({ id_atendente: user.id_usuario, status_chamado: 'EM_ANDAMENTO' })
        .eq('id_chamado', Number(id));
      if (error) throw error;
      toast({ title: "Chamado assumido", description: "Você agora é o responsável." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleMudarStatus = async () => {
    if (novoStatus === chamado?.status) return;
    if ((novoStatus === 'aguardando' || novoStatus === 'concluido') && !justificativa.trim()) {
      toast({
        title: novoStatus === 'aguardando' ? "Justificativa obrigatória" : "Comentário de conclusão obrigatório",
        description: novoStatus === 'aguardando' ? "Forneça uma justificativa." : "Forneça um comentário de conclusão.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('chamados')
        .update({ status_chamado: novoStatus.toUpperCase() })
        .eq('id_chamado', Number(id));
      if (error) throw error;

      if ((novoStatus === 'aguardando' || novoStatus === 'concluido') && user) {
        await supabase.from('interacao').insert({
          id_chamado: Number(id),
          id_usuario: user.id_usuario,
          tipo_interacao: 'MUDANCA_STATUS',
          conteudo: novoStatus === 'aguardando'
            ? `Status alterado para AGUARDANDO. Justificativa: ${justificativa}`
            : `Chamado CONCLUÍDO. Resolução: ${justificativa}`,
        });
        setJustificativa("");
      }

      toast({ title: "Status atualizado", description: "O status do chamado foi alterado." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeletarChamado = async () => {
    try {
      const { error } = await supabase.from('chamados').delete().eq('id_chamado', Number(id));
      if (error) throw error;
      toast({ title: "Chamado deletado", description: "O chamado foi removido." });
      navigate(ehAtendente ? '/painel-ti' : '/meus-chamados');
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDownloadAnexo = async (anexo: any) => {
    try {
      const { data, error } = await supabase.storage.from('chamado-anexos').download(anexo.caminho_servidor);
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
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
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
          <Button onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
        </div>
      </MainLayout>
    );
  }

  const ehAtendente = user?.eh_atendente || user?.eh_admin;
  const ehSolicitante = user?.id_usuario === chamado.id_solicitante;
  const podeDeletear = user?.eh_admin || (ehSolicitante && chamado.status === 'aberto');
  const statusInfo = statusConfig[chamado.status] || statusConfig.aberto;
  const prioridadeInfo = prioridadeConfig[chamado.prioridade] || prioridadeConfig.baixa;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">{chamado.titulo}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Chamado #{chamado.id_chamado}</p>
            </div>
          </div>
          
          {podeDeletear && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Deletar Chamado</span>
                  <span className="sm:hidden">Deletar</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>Tem certeza que deseja deletar este chamado? Esta ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletarChamado}>Deletar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <Card className="shadow-card">
              <CardHeader><CardTitle>Descrição</CardTitle></CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{chamado.descricao}</p>
              </CardContent>
            </Card>

            {anexos.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />Anexos ({anexos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {anexos.map((anexo) => (
                      <div key={anexo.id_anexo} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{anexo.nome_original}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadAnexo(anexo)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline de Interações */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />Histórico de Interações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {interacoes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma interação registrada.</p>
                )}
                {interacoes.map((interacao) => {
                  const isMudancaStatus = interacao.tipo_interacao === 'MUDANCA_STATUS' || interacao.tipo_interacao === 'mudanca_status';
                  const isAtribuicao = interacao.tipo_interacao === 'atribuicao';
                  const isSystem = isMudancaStatus || isAtribuicao;

                  return (
                    <div
                      key={interacao.id_interacao}
                      className={`pl-4 py-3 rounded-r-lg ${
                        isSystem
                          ? 'border-l-2 border-warning bg-warning/5'
                          : 'border-l-2 border-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {isSystem ? (
                          <ArrowRightLeft className="h-4 w-4 text-warning" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{interacao.funcionario_nome}</span>
                        {isSystem && (
                          <Badge variant="warning" className="text-xs">Sistema</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(interacao.data_interacao)}
                        </span>
                      </div>
                      <p className={`text-sm ${isSystem ? 'italic text-muted-foreground' : ''}`}>
                        {interacao.mensagem}
                      </p>
                    </div>
                  );
                })}

                <div className="pt-4 space-y-2">
                  <Textarea
                    placeholder="Adicione um comentário..."
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    rows={3}
                    className="text-sm"
                    maxLength={2000}
                  />
                  <Button onClick={handleAdicionarComentario} disabled={!novoComentario.trim()} className="w-full sm:w-auto">
                    <MessageSquare className="h-4 w-4 mr-2" />Adicionar Comentário
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <Card className="shadow-card">
              <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Prioridade</p>
                  <Badge variant={prioridadeInfo.variant}>{prioridadeInfo.label}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Solicitante</p>
                  <p className="font-medium">{chamado.solicitante_nome}</p>
                </div>
                {chamado.atendente_nome && (
                  <div>
                    <p className="text-muted-foreground mb-1">Atendente</p>
                    <p className="font-medium">{chamado.atendente_nome}</p>
                  </div>
                )}
                {chamado.setor_origem_nome && (
                  <div>
                    <p className="text-muted-foreground mb-1">Setor Origem</p>
                    <p className="font-medium">{chamado.setor_origem_nome}</p>
                  </div>
                )}
                {chamado.setor_destino_nome && (
                  <div>
                    <p className="text-muted-foreground mb-1">Setor Destino</p>
                    <p className="font-medium">{chamado.setor_destino_nome}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">Data de Abertura</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">{formatDate(chamado.data_abertura)}</span>
                  </div>
                </div>
                {chamado.data_assumido && (
                  <div>
                    <p className="text-muted-foreground mb-1">Data Assumido</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">{formatDate(chamado.data_assumido)}</span>
                    </div>
                  </div>
                )}
                {chamado.data_fechamento && (
                  <div>
                    <p className="text-muted-foreground mb-1">Data de Fechamento</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">{formatDate(chamado.data_fechamento)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {ehAtendente && (
              <Card className="shadow-card">
                <CardHeader><CardTitle>Ações do Atendente</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {!chamado.id_atendente && (
                    <Button className="w-full" onClick={handleAssumirChamado} size="sm">Assumir Chamado</Button>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Alterar Status</p>
                    <Select value={novoStatus} onValueChange={setNovoStatus}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberto">Aberto</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="aguardando">Aguardando</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="fechado">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {(novoStatus === 'aguardando' || novoStatus === 'concluido') && (
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm text-muted-foreground">
                          {novoStatus === 'aguardando' ? 'Justificativa (obrigatória)' : 'Comentário de conclusão (obrigatório)'}
                        </label>
                        <Textarea
                          placeholder={novoStatus === 'aguardando' ? "Descreva o motivo..." : "Descreva a resolução..."}
                          value={justificativa}
                          onChange={(e) => setJustificativa(e.target.value)}
                          rows={3}
                          className="text-sm"
                        />
                      </div>
                    )}
                    
                    <Button variant="outline" className="w-full" size="sm" onClick={handleMudarStatus} disabled={novoStatus === chamado.status}>
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
