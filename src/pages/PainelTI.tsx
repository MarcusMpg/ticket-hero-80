import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChamadoCard } from "@/components/chamados/ChamadoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Chamado } from "@/types/chamado";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function PainelTI() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  if (!user?.eh_atendente) {
    return <Navigate to="/abrir-chamado" replace />;
  }

  useEffect(() => {
    const fetchChamados = async () => {
      try {
        const { data, error } = await supabase
          .from('chamados')
          .select(`
            *,
            solicitante:usuario!chamados_id_solicitante_fkey(nome),
            atendente:usuario!chamados_id_atendente_fkey(nome)
          `)
          .is('id_atendente', null)
          .eq('status_chamado', 'aberto')
          .order('data_abertura', { ascending: false });

        if (error) throw error;

        const chamadosMapeados: Chamado[] = (data || []).map((item: any) => ({
          id_chamado: item.id_chamado,
          titulo: item.titulo,
          descricao: item.descricao,
          status: item.status_chamado as any,
          prioridade: item.prioridade as any,
          id_solicitante: item.id_solicitante,
          id_atendente: item.id_atendente,
          id_setor_destino: item.id_setor,
          data_abertura: item.data_abertura,
          data_fechamento: item.data_fechamento,
          solicitante_nome: item.solicitante?.nome,
          atendente_nome: item.atendente?.nome,
        }));

        setChamados(chamadosMapeados);
      } catch (error) {
        console.error("Erro ao carregar fila de chamados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChamados();
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Fila de Chamados TI</h1>
          <p className="text-muted-foreground">Chamados aguardando atribuição</p>
        </div>

        {chamados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">Não há chamados na fila no momento</p>
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
