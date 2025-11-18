import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChamadoCard } from "@/components/chamados/ChamadoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Chamado } from "@/types/chamado";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function MeusAtendimentos() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchChamados = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('chamados')
          .select(`
            *,
            solicitante:usuario!fk_chamados_id_solicitante_cascade(nome),
            atendente:usuario!fk_chamados_id_atendente_setnull(nome)
          `)
          .eq('id_atendente', user.id_usuario)
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
          solicitante_nome: item.solicitante?.nome,
          atendente_nome: item.atendente?.nome,
        }));

        setChamados(chamadosMapeados);
        setIsInitialLoad(false);
      } catch (error) {
        console.error("Erro ao carregar atendimentos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChamados();

    if (!user) return;

    // Configurar realtime para atualizar atendimentos em tempo real
    const channel = supabase
      .channel('meus-atendimentos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chamados',
          filter: `id_atendente=eq.${user.id_usuario}`
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
            .eq('id_atendente', user.id_usuario)
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
            if (!isInitialLoad) {
              if (payload.eventType === 'INSERT') {
                toast({
                  title: "Novo atendimento",
                  description: "Um novo chamado foi atribuído a você",
                });
              } else if (payload.eventType === 'UPDATE') {
                toast({
                  title: "Atendimento atualizado",
                  description: "Um dos seus atendimentos foi atualizado",
                });
              } else if (payload.eventType === 'DELETE') {
                toast({
                  title: "Atendimento removido",
                  description: "Um atendimento foi removido",
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
  }, [user]);

  if (!user?.eh_atendente) {
    return <Navigate to="/abrir-chamado" replace />;
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Carregando atendimentos...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meus Atendimentos</h1>
          <p className="text-muted-foreground">Chamados atribuídos a você</p>
        </div>

        {chamados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">Você não possui chamados atribuídos no momento</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chamados.map((chamado) => (
              <ChamadoCard key={chamado.id_chamado} chamado={chamado} showAtendente />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
