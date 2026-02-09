import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChamadoCard } from "@/components/chamados/ChamadoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Chamado } from "@/types/chamado";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CadastrarUsuarioDialog } from "@/components/admin/CadastrarUsuarioDialog";
import { ListaUsuarios } from "@/components/admin/ListaUsuarios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { mapChamado, CHAMADOS_SELECT } from "@/hooks/useChamados";

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
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [filtroSetorOrigem, setFiltroSetorOrigem] = useState<string>("all");
  const [filtroSetorDestino, setFiltroSetorDestino] = useState<string>("all");
  const isInitialLoadRef = useRef(true);

  const isAuthorized = user?.eh_atendente || user?.eh_admin || user?.eh_diretor;

  const fetchChamados = async () => {
    try {
      const { data, error } = await supabase
        .from("chamados")
        .select(CHAMADOS_SELECT)
        .order("data_abertura", { ascending: false });

      if (error) throw error;
      setChamados((data || []).map(mapChamado));
      isInitialLoadRef.current = false;
    } catch (error) {
      console.error("Erro ao carregar chamados:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchChamados();

      const [filiaisRes, setoresRes] = await Promise.all([
        supabase.from("filial").select("*").order("nome_filial"),
        supabase.from("setor").select("*").order("nome_setor"),
      ]);

      if (filiaisRes.data) setFiliais(filiaisRes.data);
      if (setoresRes.data) setSetores(setoresRes.data);
      setIsLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel("painel-ti-chamados")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chamados" },
        async (payload) => {
          await fetchChamados();
          if (!isInitialLoadRef.current) {
            const messages: Record<
              string,
              { title: string; description: string }
            > = {
              INSERT: {
                title: "Novo chamado",
                description: "Um novo chamado foi adicionado à fila",
              },
              UPDATE: {
                title: "Chamado atualizado",
                description: "Um chamado foi atualizado",
              },
              DELETE: {
                title: "Chamado removido",
                description: "Um chamado foi removido da fila",
              },
            };
            const msg = messages[payload.eventType];
            if (msg) toast(msg);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  if (!isAuthorized) return <Navigate to="/abrir-chamado" replace />;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">
              Carregando fila de chamados...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const handleUsuarioCriado = () => {};

  const handleAssumirChamado = async (chamadoId: number) => {
    try {
      const { error } = await supabase
        .from("chamados")
        .update({
          id_atendente: user?.id_usuario,
          status_chamado: "EM_ANDAMENTO",
        })
        .eq("id_chamado", chamadoId);

      if (error) throw error;

      await supabase.from("interacao").insert({
        id_chamado: chamadoId,
        id_usuario: user?.id_usuario,
        tipo_interacao: "atribuicao",
        conteudo: `Chamado assumido por ${user?.nome}`,
      });

      toast({ title: "Sucesso", description: "Chamado assumido com sucesso!" });
      await fetchChamados();
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
    if (filtroPrioridade !== "all" && chamado.prioridade !== filtroPrioridade)
      return false;
    if (filtroStatus !== "all" && chamado.status !== filtroStatus) return false;
    if (
      filtroSetorOrigem !== "all" &&
      String(chamado.id_setor_origem) !== filtroSetorOrigem
    )
      return false;
    if (
      filtroSetorDestino !== "all" &&
      String(chamado.id_setor_destino) !== filtroSetorDestino
    )
      return false;
    return true;
  });

  // Para atendentes: filtrar por setor do atendente
  const chamadosMeuSetor = chamados.filter(
    (c) => c.id_setor_destino === user?.id_setor,
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Painel</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerenciamento de chamados e usuários
          </p>
        </div>

        <Tabs defaultValue="chamados" className="w-full">
          <TabsList className="w-full sm:w-auto flex-wrap">
            <TabsTrigger value="chamados" className="flex-1 sm:flex-none">
              {user?.eh_diretor || user?.eh_admin
                ? "Todos Chamados"
                : "Meu Setor"}
            </TabsTrigger>
            {user?.eh_atendente && !user?.eh_admin && !user?.eh_diretor && (
              <TabsTrigger value="todos" className="flex-1 sm:flex-none">
                Todos
              </TabsTrigger>
            )}
            {user?.eh_admin && (
              <TabsTrigger value="usuarios" className="flex-1 sm:flex-none">
                Usuários
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="chamados" className="space-y-4">
            {/* Filtros */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Select
                value={filtroPrioridade}
                onValueChange={setFiltroPrioridade}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Prioridades</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              {(user?.eh_diretor || user?.eh_admin) && (
                <>
                  <Select
                    value={filtroSetorOrigem}
                    onValueChange={setFiltroSetorOrigem}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Setor Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Origens</SelectItem>
                      {setores.map((s) => (
                        <SelectItem key={s.id_setor} value={String(s.id_setor)}>
                          {s.nome_setor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filtroSetorDestino}
                    onValueChange={setFiltroSetorDestino}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Setor Destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Destinos</SelectItem>
                      {setores.map((s) => (
                        <SelectItem key={s.id_setor} value={String(s.id_setor)}>
                          {s.nome_setor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {(() => {
              const list =
                user?.eh_diretor || user?.eh_admin
                  ? chamadosFiltrados
                  : chamadosMeuSetor.filter((c) => {
                      if (
                        filtroPrioridade !== "all" &&
                        c.prioridade !== filtroPrioridade
                      )
                        return false;
                      if (filtroStatus !== "all" && c.status !== filtroStatus)
                        return false;
                      return true;
                    });
              return list.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-lg text-muted-foreground">
                    Não há chamados na fila no momento
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((chamado) => (
                    <ChamadoCard
                      key={chamado.id_chamado}
                      chamado={chamado}
                      showAtendente
                      onAssumirChamado={handleAssumirChamado}
                      isAtendente={user?.eh_atendente || user?.eh_admin}
                    />
                  ))}
                </div>
              );
            })()}
          </TabsContent>

          {user?.eh_atendente && !user?.eh_admin && !user?.eh_diretor && (
            <TabsContent value="todos" className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={filtroPrioridade}
                  onValueChange={setFiltroPrioridade}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="aguardando">Aguardando</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {chamadosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-lg text-muted-foreground">
                    Não há chamados no momento
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {chamadosFiltrados.map((chamado) => (
                    <ChamadoCard
                      key={chamado.id_chamado}
                      chamado={chamado}
                      showAtendente
                      onAssumirChamado={handleAssumirChamado}
                      isAtendente
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {user?.eh_admin && (
            <TabsContent value="usuarios" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Gerenciar Usuários
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Cadastre novos usuários no sistema
                  </p>
                </div>
                <CadastrarUsuarioDialog
                  filiais={filiais}
                  setores={setores}
                  onUsuarioCriado={handleUsuarioCriado}
                />
              </div>
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">
                  Usuários Cadastrados
                </h3>
                <ListaUsuarios filiais={filiais} setores={setores} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
