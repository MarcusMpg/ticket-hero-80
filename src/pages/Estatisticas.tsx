import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chamado } from "@/types/chamado";

export default function Estatisticas() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const isAuthorized = user?.eh_atendente || user?.eh_admin;

  useEffect(() => {
    const fetchChamados = async () => {
      try {
        const { data, error } = await supabase
          .from('chamados')
          .select('*')
          .order('data_abertura', { ascending: false });

        if (error) throw error;

        const chamadosMapeados: Chamado[] = (data || []).map((item: any) => ({
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
        }));

        setChamados(chamadosMapeados);
      } catch (error) {
        console.error("Erro ao carregar chamados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChamados();

    // Realtime subscription
    const channel = supabase
      .channel('estatisticas-chamados')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chamados' },
        () => fetchChamados()
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
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Estatísticas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Resumo dos chamados do sistema</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">{chamados.filter(c => c.status === 'aberto').length}</p>
            <p className="text-sm text-muted-foreground mt-1">Abertos</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">{chamados.filter(c => c.status === 'em_andamento').length}</p>
            <p className="text-sm text-muted-foreground mt-1">Em Andamento</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{chamados.filter(c => c.status === 'aguardando').length}</p>
            <p className="text-sm text-muted-foreground mt-1">Aguardando</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-500">{chamados.filter(c => c.status === 'concluido').length}</p>
            <p className="text-sm text-muted-foreground mt-1">Concluídos</p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-3xl font-bold">{chamados.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Total</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Por Prioridade</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-red-500">Alta</span>
                <span className="font-bold">{chamados.filter(c => c.prioridade === 'alta').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-yellow-500">Média</span>
                <span className="font-bold">{chamados.filter(c => c.prioridade === 'media').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-500">Baixa</span>
                <span className="font-bold">{chamados.filter(c => c.prioridade === 'baixa').length}</span>
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Resumo</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sem atendente</span>
                <span className="font-bold">{chamados.filter(c => !c.id_atendente).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Em atendimento</span>
                <span className="font-bold">{chamados.filter(c => c.id_atendente).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
