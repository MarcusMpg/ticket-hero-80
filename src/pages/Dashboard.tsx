import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, Zap, TrendingUp, AlertTriangle } from "lucide-react";

interface ChamadoRaw {
  data_abertura: string | null;
  data_assumido: string | null;
  data_fechamento: string | null;
  status_chamado: string;
  id_setor_destino: number;
}

interface SetorInfo {
  id_setor: number;
  nome_setor: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [chamados, setChamados] = useState<ChamadoRaw[]>([]);
  const [setores, setSetores] = useState<SetorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthorized = user?.eh_admin || user?.eh_diretor;

  useEffect(() => {
    const fetch = async () => {
      const [chamadosRes, setoresRes] = await Promise.all([
        supabase.from('chamados').select('data_abertura, data_assumido, data_fechamento, status_chamado, id_setor_destino'),
        supabase.from('setor').select('*'),
      ]);
      if (chamadosRes.data) setChamados(chamadosRes.data);
      if (setoresRes.data) setSetores(setoresRes.data);
      setIsLoading(false);
    };
    fetch();
  }, []);

  if (!isAuthorized) return <Navigate to="/abrir-chamado" replace />;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Cálculos de métricas
  const calcMediaHoras = (diffs: number[]) => {
    if (diffs.length === 0) return null;
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return avg;
  };

  const temposReacao: number[] = [];
  const temposResolucao: number[] = [];

  chamados.forEach(c => {
    if (c.data_abertura && c.data_assumido) {
      const diff = (new Date(c.data_assumido).getTime() - new Date(c.data_abertura).getTime()) / (1000 * 60 * 60);
      if (diff >= 0) temposReacao.push(diff);
    }
    if (c.data_assumido && c.data_fechamento) {
      const diff = (new Date(c.data_fechamento).getTime() - new Date(c.data_assumido).getTime()) / (1000 * 60 * 60);
      if (diff >= 0) temposResolucao.push(diff);
    }
  });

  const mediaReacao = calcMediaHoras(temposReacao);
  const mediaResolucao = calcMediaHoras(temposResolucao);

  const formatHoras = (h: number | null) => {
    if (h === null) return "—";
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 24) return `${h.toFixed(1)} h`;
    return `${(h / 24).toFixed(1)} dias`;
  };

  // Volume por setor
  const volumePorSetor = setores.map(s => ({
    nome: s.nome_setor,
    total: chamados.filter(c => c.id_setor_destino === s.id_setor).length,
    abertos: chamados.filter(c => c.id_setor_destino === s.id_setor && c.status_chamado === 'ABERTO').length,
  })).filter(s => s.total > 0).sort((a, b) => b.total - a.total);

  const totalAbertos = chamados.filter(c => c.status_chamado === 'ABERTO').length;
  const totalAndamento = chamados.filter(c => c.status_chamado === 'EM_ANDAMENTO').length;
  const totalConcluidos = chamados.filter(c => c.status_chamado === 'CONCLUIDO').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard de Performance</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Visão geral de métricas e indicadores</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Zap className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo Médio de Reação</p>
                  <p className="text-xl font-bold">{formatHoras(mediaReacao)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Clock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tempo Médio de Resolução</p>
                  <p className="text-xl font-bold">{formatHoras(mediaResolucao)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Abertos / Em Andamento</p>
                  <p className="text-xl font-bold">{totalAbertos} / {totalAndamento}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                  <p className="text-xl font-bold">{totalConcluidos}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de volume por setor */}
        <Card>
          <CardHeader>
            <CardTitle>Volume de Chamados por Setor Destino</CardTitle>
          </CardHeader>
          <CardContent>
            {volumePorSetor.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes para exibir.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={volumePorSetor} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="nome" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="abertos" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} name="Abertos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-info/10 border border-info/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-info">{totalAbertos}</p>
            <p className="text-sm text-muted-foreground mt-1">Abertos</p>
          </div>
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-warning">{totalAndamento}</p>
            <p className="text-sm text-muted-foreground mt-1">Em Andamento</p>
          </div>
          <div className="bg-secondary/50 border border-border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold">{chamados.filter(c => c.status_chamado === 'AGUARDANDO').length}</p>
            <p className="text-sm text-muted-foreground mt-1">Aguardando</p>
          </div>
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-success">{totalConcluidos}</p>
            <p className="text-sm text-muted-foreground mt-1">Concluídos</p>
          </div>
          <div className="bg-muted/50 border border-border rounded-lg p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-3xl font-bold">{chamados.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Total</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
