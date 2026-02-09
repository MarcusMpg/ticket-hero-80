import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChamadoCard } from "@/components/chamados/ChamadoCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Chamado } from "@/types/chamado";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mapChamado, CHAMADOS_SELECT } from "@/hooks/useChamados";

export default function MeusChamados() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchChamados = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('chamados')
          .select(CHAMADOS_SELECT)
          .eq('id_solicitante', user.id_usuario)
          .order('data_abertura', { ascending: false });

        if (error) throw error;
        setChamados((data || []).map(mapChamado));
        setIsInitialLoad(false);
      } catch (error) {
        console.error("Erro ao carregar chamados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChamados();

    if (!user) return;

    const channel = supabase
      .channel('meus-chamados')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chamados', filter: `id_solicitante=eq.${user.id_usuario}` }, async (payload) => {
        const { data, error } = await supabase
          .from('chamados')
          .select(CHAMADOS_SELECT)
          .eq('id_solicitante', user.id_usuario)
          .order('data_abertura', { ascending: false });

        if (!error && data) {
          setChamados(data.map(mapChamado));
          if (!isInitialLoad) {
            if (payload.eventType === 'UPDATE') toast({ title: "Chamado atualizado", description: "Um dos seus chamados foi atualizado" });
            else if (payload.eventType === 'DELETE') toast({ title: "Chamado removido", description: "Um chamado foi removido" });
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Carregando chamados...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Meus Chamados</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Acompanhe o status dos seus chamados</p>
          </div>
          <Button onClick={() => navigate("/abrir-chamado")} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Chamado
          </Button>
        </div>

        {chamados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">Você ainda não possui chamados abertos</p>
            <Button onClick={() => navigate("/abrir-chamado")}>
              <Plus className="mr-2 h-4 w-4" />
              Abrir Primeiro Chamado
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chamados.map((chamado) => (
              <ChamadoCard key={chamado.id_chamado} chamado={chamado} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
