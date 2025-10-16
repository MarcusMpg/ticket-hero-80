import { useState, useEffect } from "react";
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

  if (!user?.eh_atendente && !user?.eh_admin) {
    return <Navigate to="/abrir-chamado" replace />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar chamados
        const { data: chamadosData, error: chamadosError } = await supabase
          .from('chamados')
          .select(`
            *,
            solicitante:usuario!chamados_id_solicitante_fkey(nome),
            atendente:usuario!chamados_id_atendente_fkey(nome)
          `)
          .is('id_atendente', null)
          .eq('status_chamado', 'ABERTO')
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
  }, []);

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Painel TI</h1>
          <p className="text-muted-foreground">Gerenciamento de chamados e usuários</p>
        </div>

        <Tabs defaultValue="chamados" className="w-full">
          <TabsList>
            <TabsTrigger value="chamados">Fila de Chamados</TabsTrigger>
            {user?.eh_admin && <TabsTrigger value="usuarios">Cadastrar Usuários</TabsTrigger>}
          </TabsList>

          <TabsContent value="chamados" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Chamados Aguardando Atribuição</h2>
              <p className="text-sm text-muted-foreground">Chamados abertos sem atendente</p>
            </div>

            {chamados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-muted-foreground">Não há chamados na fila no momento</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {chamados.map((chamado) => (
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
              <div className="flex items-center justify-between">
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
                <ListaUsuarios />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
