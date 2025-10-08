import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChamadoCard } from "@/components/chamados/ChamadoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Chamado } from "@/types/chamado";
import { Navigate } from "react-router-dom";

export default function PainelTI() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAuth();

  if (!user?.eh_atendente) {
    return <Navigate to="/abrir-chamado" replace />;
  }

  useEffect(() => {
    const fetchChamados = async () => {
      try {
        // Simulação de API - substituir pela chamada real
        // const response = await fetch('/api/chamados/fila-ti', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        // const data = await response.json();

        // Mock de dados
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockChamados: Chamado[] = [
          {
            id_chamado: 3,
            titulo: "Acesso ao sistema de vendas",
            descricao: "Não consigo acessar o sistema de vendas, aparece erro 403.",
            status: "aberto",
            prioridade: "media",
            id_solicitante: 1,
            id_atendente: null,
            id_setor_destino: 1,
            data_abertura: new Date().toISOString(),
            data_fechamento: null,
            solicitante_nome: "João Silva",
          },
          {
            id_chamado: 4,
            titulo: "Instalar novo software",
            descricao: "Preciso do Adobe Photoshop instalado no meu computador.",
            status: "aberto",
            prioridade: "baixa",
            id_solicitante: 3,
            id_atendente: null,
            id_setor_destino: 1,
            data_abertura: new Date(Date.now() - 3600000).toISOString(),
            data_fechamento: null,
            solicitante_nome: "Maria Santos",
          },
          {
            id_chamado: 5,
            titulo: "Problema na impressora",
            descricao: "A impressora do 2º andar está travando papel constantemente.",
            status: "aberto",
            prioridade: "alta",
            id_solicitante: 4,
            id_atendente: null,
            id_setor_destino: 1,
            data_abertura: new Date(Date.now() - 7200000).toISOString(),
            data_fechamento: null,
            solicitante_nome: "Pedro Oliveira",
          },
        ];

        setChamados(mockChamados);
      } catch (error) {
        console.error("Erro ao carregar fila de chamados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChamados();
  }, [token]);

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
