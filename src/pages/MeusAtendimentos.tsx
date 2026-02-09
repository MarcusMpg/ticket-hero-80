import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChamadoCard } from "@/components/chamados/ChamadoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Chamado } from "@/types/chamado";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mapChamado, CHAMADOS_SELECT } from "@/hooks/useChamados";

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
          .select(CHAMADOS_SELECT)
          .eq('id_atendente', user.id_usuario)
          .order('data_abertura', { ascending: false });

        if (error) throw error;
        setChamados((data || []).map(mapChamado));
        setIsInitialLoad(false);
      } catch (error) {
        console.error("Erro ao carregar atendimentos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChamados();

    if (!user) return;

    const channel = supabase
      .channel('meus-atendimentos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chamados', filter: `id_atendente=eq.${user.id_usuario}` }, async (payload) => {
        const { data, error } = await supabase
          .from('chamados')
          .select(CHAMADOS_SELECT)
          .eq('id_atendente', user.id_usuario)
          .order('data_abertura', { ascending: false });

        if (!error && data) {
          setChamados(data.map(mapChamado));
          if (!isInitialLoad) {
            const messages: Record<string, { title: string; description: string }> = {
              INSERT: { title: "Novo atendimento", description: "Um novo chamado foi atribuído a você" },
              UPDATE: { title: "Atendimento atualizado", description: "Um dos seus atendimentos foi atualizado" },
              DELETE: { title: "Atendimento removido", description: "Um atendimento foi removido" },
            };
            const msg = messages[payload.eventType];
            if (msg) toast(msg);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user?.eh_atendente) return <Navigate to="/abrir-chamado" replace />;

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
