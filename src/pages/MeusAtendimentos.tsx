import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChamadoCard } from "@/components/chamados/ChamadoCard";
import { useAuth } from "@/contexts/AuthContext";
import { Chamado } from "@/types/chamado";
import { Navigate } from "react-router-dom";

export default function MeusAtendimentos() {
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
        // const response = await fetch(`/api/chamados/atendente/${user?.id_funcionario}`, {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // });
        // const data = await response.json();

        // Mock de dados
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const mockChamados: Chamado[] = [
          {
            id_chamado: 1,
            titulo: "Computador não liga",
            descricao: "O computador da minha estação não está ligando desde ontem.",
            status: "em_andamento",
            prioridade: "alta",
            id_solicitante: 1,
            id_atendente: user?.id_funcionario || 2,
            id_setor_destino: 1,
            data_abertura: new Date(Date.now() - 86400000).toISOString(),
            data_fechamento: null,
            solicitante_nome: "João Silva",
          },
          {
            id_chamado: 2,
            titulo: "Senha do e-mail expirou",
            descricao: "Preciso redefinir a senha do meu e-mail corporativo.",
            status: "resolvido",
            prioridade: "media",
            id_solicitante: 1,
            id_atendente: user?.id_funcionario || 2,
            id_setor_destino: 1,
            data_abertura: new Date(Date.now() - 172800000).toISOString(),
            data_fechamento: new Date(Date.now() - 86400000).toISOString(),
            solicitante_nome: "João Silva",
          },
        ];

        setChamados(mockChamados);
      } catch (error) {
        console.error("Erro ao carregar atendimentos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChamados();
  }, [user, token]);

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
