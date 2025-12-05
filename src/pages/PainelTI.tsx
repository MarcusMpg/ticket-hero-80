import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChamadoCard } from "@/components/chamados/ChamadoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Chamado } from "@/types/chamado";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CadastrarUsuarioDialog } from "@/components/admin/CadastrarUsuarioDialog";
import { ListaUsuarios } from "@/components/admin/ListaUsuarios";
import { useToast } from "@/hooks/use-toast";

interface Filial {
  id_filial: number;
  nome_filial: string;
}

interface Setor {
  id_setor: number;
  nome_setor: string;
}

export default function PainelTI() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroData, setFiltroData] = useState<string>("");
  const isInitialLoadRef = useRef(true);
  
  const isAuthorized = user?.eh_atendente || user?.eh_admin;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar chamados - sem filtros, a RLS vai controlar o acesso
        const { data: chamadosData, error: chamadosError } = await supabase
          .from('chamados')
          .select(`
            *,
            solicitante:usuario!fk_chamados_id_solicitante_cascade(nome),
            atendente:usuario!fk_chamados_id_atendente_setnull(nome)
          `)
          .order('data_abertura', { ascending: false });

        if (chamadosError) throw chamadosError;

        const chamadosMapeados: Chamado[] = (chamadosData || []).map((item: any) => ({
          id_chamado: item.id_chamado,
          titulo: item.titulo,
          descricao: item.descricao,
          status: item.status_chamado.toLowerCase() as any,
          prioridade: item.prioridade.toLowerCase() as any,
          id_solicitante: item.id_solicitante,
          id_atendente: item.id_atendente,
          id_setor_destino: item.id_setor,
          data_abertura: item.data_abertura,
          data_fechamento: item.data_fechamento,
          solicitante_nome: item.solicitante?.nome,
          atendente_nome: item.atendente?.nome,
        }));

        setChamados(chamadosMapeados);
        isInitialLoadRef.current = false;

        // Buscar filiais
        const { data: filiaisData, error: filiaisError } = await supabase
          .from('filial')
          .select('*')
          .order('nome_filial');

        if (filiaisError) throw filiaisError;
        setFiliais(filiaisData || []);

        // Buscar setores
        const { data: setoresData, error: setoresError } = await supabase
          .from('setor')
          .select('*')
          .order('nome_setor');

        if (setoresError) throw setoresError;
        setSetores(setoresData || []);

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Configurar realtime para atualizar chamados em tempo real
    const channel = supabase
      .channel('painel-ti-chamados')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chamados'
        },
        async (payload) => {
          // Recarregar chamados quando houver mudanças
          const { data, error } = await supabase
            .from('chamados')
            .select(`
              *,
              solicitante:usuario!fk_chamados_id_solicitante_cascade(nome),
              atendente:usuario!fk_chamados_id_atendente_setnull(nome)
            `)
            .order('data_abertura', { ascending: false });

          if (!error && data) {
            const chamadosMapeados: Chamado[] = data.map((item: any) => ({
              id_chamado: item.id_chamado,
              titulo: item.titulo,
              descricao: item.descricao,
              status: item.status_chamado.toLowerCase() as any,
              prioridade: item.prioridade.toLowerCase() as any,
              id_solicitante: item.id_solicitante,
              id_atendente: item.id_atendente,
              id_setor_destino: item.id_setor,
              data_abertura: item.data_abertura,
              data_fechamento: item.data_fechamento,
              solicitante_nome: item.solicitante?.nome,
              atendente_nome: item.atendente?.nome,
            }));
            setChamados(chamadosMapeados);

            // Mostrar notificação apenas após carga inicial
            if (!isInitialLoadRef.current) {
              if (payload.eventType === 'INSERT') {
                toast({
                  title: "Novo chamado",
                  description: "Um novo chamado foi adicionado à fila",
                });
              } else if (payload.eventType === 'UPDATE') {
                toast({
                  title: "Chamado atualizado",
                  description: "Um chamado foi atualizado",
                });
              } else if (payload.eventType === 'DELETE') {
                toast({
                  title: "Chamado removido",
                  description: "Um chamado foi removido da fila",
                });
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!isAuthorized) {
    return <Navigate to="/abrir-chamado" replace />;
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Carregando fila de chamados...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleUsuarioCriado = () => {
    // Recarregar dados se necessário
  };

  const handleAssumirChamado = async (chamadoId: number) => {
    try {
      const { error } = await supabase
        .from('chamados')
        .update({
          id_atendente: user?.id_usuario,
          status_chamado: 'EM_ANDAMENTO'
        })
        .eq('id_chamado', chamadoId);

      if (error) throw error;

      // Criar interação de atribuição
      await supabase
        .from('interacao')
        .insert({
          id_chamado: chamadoId,
          id_usuario: user?.id_usuario,
          tipo_interacao: 'atribuicao',
          conteudo: `Chamado assumido por ${user?.nome}`
        });

      toast({
        title: "Sucesso",
        description: "Chamado assumido com sucesso!",
      });

      // Remover da lista de chamados na fila
      setChamados(prev => prev.filter(c => c.id_chamado !== chamadoId));
    } catch (error) {
      console.error("Erro ao assumir chamado:", error);
      toast({
        title: "Erro",
        description: "Não foi possível assumir o chamado",
        variant: "destructive",
      });
    }
  };

  const chamadosFiltrados = chamados.filter((chamado) => {
    const prioridadeMatch = filtroPrioridade ? chamado.prioridade === filtroPrioridade : true;
    const statusMatch = filtroStatus ? chamado.status === filtroStatus : true;
    const dataMatch = filtroData ? chamado.data_abertura?.slice(0, 10) === filtroData : true;
    return prioridadeMatch && statusMatch && dataMatch;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Painel TI</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerenciamento de chamados e usuários</p>
        </div>

        <Tabs defaultValue="chamados" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="chamados" className="flex-1 sm:flex-none">Fila de Chamados</TabsTrigger>
            {user?.eh_admin && <TabsTrigger value="usuarios" className="flex-1 sm:flex-none">Usuários</TabsTrigger>}
          </TabsList>

          <TabsContent value="chamados" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Fila de Chamados</h2>
              <p className="text-sm text-muted-foreground">Todos os chamados do sistema</p>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
              <select
                value={filtroPrioridade}
                onChange={e => setFiltroPrioridade(e.target.value)}
                className="border border-border rounded-md px-3 py-2 bg-background text-sm"
              >
                <option value="">Todas Prioridades</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                className="border border-border rounded-md px-3 py-2 bg-background text-sm"
              >
                <option value="">Todos Status</option>
                <option value="aberto">Aberto</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="aguardando">Aguardando</option>
                <option value="concluido">Concluído</option>
                <option value="fechado">Fechado</option>
              </select>
              <input
                type="date"
                value={filtroData}
                onChange={e => setFiltroData(e.target.value)}
                className="border border-border rounded-md px-3 py-2 bg-background text-sm"
              />
            </div>

            {chamadosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-muted-foreground">Não há chamados na fila no momento</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {chamadosFiltrados.map((chamado) => (
                  <ChamadoCard 
                    key={chamado.id_chamado} 
                    chamado={chamado} 
                    showAtendente 
                    onAssumirChamado={handleAssumirChamado}
                    isAtendente={user?.eh_atendente || user?.eh_admin}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {user?.eh_admin && (
            <TabsContent value="usuarios" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Gerenciar Usuários</h2>
                  <p className="text-sm text-muted-foreground">Cadastre novos usuários no sistema</p>
                </div>
                <CadastrarUsuarioDialog 
                  filiais={filiais} 
                  setores={setores}
                  onUsuarioCriado={handleUsuarioCriado}
                />
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Usuários Cadastrados</h3>
                <ListaUsuarios filiais={filiais} setores={setores} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
