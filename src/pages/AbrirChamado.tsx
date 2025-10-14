import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AbrirChamado() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("baixa");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('chamados')
        .insert({
          titulo,
          descricao,
          prioridade: prioridade.toUpperCase(),
          status_chamado: 'ABERTO',
          id_solicitante: user.id_usuario,
          id_setor: 1, // ID do setor TI - pode ser configurável
          id_filial: user.id_filial,
        });

      if (error) throw error;

      toast({
        title: "Chamado aberto com sucesso!",
        description: "Você pode acompanhar o status em 'Meus Chamados'.",
      });

      navigate("/meus-chamados");
    } catch (error: any) {
      toast({
        title: "Erro ao abrir chamado",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Novo Chamado</h1>
          <p className="text-muted-foreground">Descreva seu problema ou solicitação</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <CardTitle>Informações do Chamado</CardTitle>
            </div>
            <CardDescription>Preencha todos os campos abaixo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Resumo do problema ou solicitação"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva detalhadamente o problema ou solicitação..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade *</Label>
                <Select value={prioridade} onValueChange={setPrioridade}>
                  <SelectTrigger id="prioridade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/meus-chamados")}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Abrindo..." : "Abrir Chamado"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
