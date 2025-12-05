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
import { Ticket, Paperclip, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { enviarNotificacaoNovoChamado } from "@/services/emailService";

export default function AbrirChamado() {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("baixa");
  const [anexos, setAnexos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAnexos([...anexos, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setAnexos(anexos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);

    try {
      // Criar o chamado primeiro
      const { data: chamadoData, error: chamadoError } = await supabase
        .from('chamados')
        .insert({
          titulo,
          descricao,
          prioridade: prioridade.toUpperCase(),
          status_chamado: 'ABERTO',
          id_solicitante: user.id_usuario,
          id_setor: 1,
          id_filial: user.id_filial,
        })
        .select()
        .single();

      if (chamadoError) throw chamadoError;

      // Upload dos anexos se houver
      if (anexos.length > 0 && chamadoData) {
        for (const arquivo of anexos) {
          const fileExt = arquivo.name.split('.').pop();
          const fileName = `${chamadoData.id_chamado}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('chamado-anexos')
            .upload(fileName, arquivo);

          if (uploadError) throw uploadError;

          // Registrar anexo na tabela
          const { error: anexoError } = await supabase
            .from('chamadoanexo')
            .insert({
              id_chamado: chamadoData.id_chamado,
              nome_original: arquivo.name,
              mime_type: arquivo.type,
              caminho_servidor: fileName,
            });

          if (anexoError) throw anexoError;
        }
      }

      // Buscar emails dos atendentes/admins para notificação
      const { data: atendentes } = await supabase
        .from('usuario')
        .select('email, nome')
        .in('tipo_usuario', ['ATENDENTE', 'ADMIN'])
        .eq('ativo', true);

      // Enviar notificação por email para cada atendente/admin
      if (atendentes && atendentes.length > 0) {
        for (const atendente of atendentes) {
          await enviarNotificacaoNovoChamado({
            to_email: atendente.email,
            to_name: atendente.nome,
            chamado_titulo: titulo,
            chamado_descricao: descricao.substring(0, 200),
            chamado_prioridade: prioridade.toUpperCase(),
            solicitante_nome: user.nome,
          });
        }
      }

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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Novo Chamado</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Descreva seu problema ou solicitação</p>
          </div>
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
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anexos">Anexos</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      id="anexos"
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      className="flex-1"
                    />
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {anexos.length > 0 && (
                    <div className="space-y-2">
                      {anexos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
