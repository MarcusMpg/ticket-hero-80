import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, ShieldCheck, Edit2, X, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TipoChamado {
  id_tipo_chamado: number;
  nome: string;
  requer_aprovacao_diretoria: boolean;
  ativo: boolean;
}

export function GerenciarTiposChamado() {
  const [tipos, setTipos] = useState<TipoChamado[]>([]);
  const [nome, setNome] = useState("");
  const [requerAprovacao, setRequerAprovacao] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editRequer, setEditRequer] = useState(false);
  const { toast } = useToast();

  const fetchTipos = async () => {
    const { data, error } = await supabase
      .from("tipo_chamado")
      .select("*")
      .order("nome");
    if (!error && data) setTipos(data);
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  const handleAdd = async () => {
    if (!nome.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from("tipo_chamado").insert({
        nome: nome.trim(),
        requer_aprovacao_diretoria: requerAprovacao,
      });
      if (error) throw error;
      setNome("");
      setRequerAprovacao(false);
      toast({ title: "Tipo de chamado cadastrado!" });
      await fetchTipos();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from("tipo_chamado")
        .delete()
        .eq("id_tipo_chamado", id);
      if (error) throw error;
      toast({ title: "Tipo removido!" });
      await fetchTipos();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const startEdit = (tipo: TipoChamado) => {
    setEditingId(tipo.id_tipo_chamado);
    setEditNome(tipo.nome);
    setEditRequer(tipo.requer_aprovacao_diretoria);
  };

  const handleUpdate = async () => {
    if (!editingId || !editNome.trim()) return;
    try {
      const { error } = await supabase
        .from("tipo_chamado")
        .update({
          nome: editNome.trim(),
          requer_aprovacao_diretoria: editRequer,
        })
        .eq("id_tipo_chamado", editingId);
      if (error) throw error;
      setEditingId(null);
      toast({ title: "Tipo atualizado!" });
      await fetchTipos();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Novo Tipo de Chamado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="nome-tipo">Nome</Label>
              <Input
                id="nome-tipo"
                placeholder="Ex: Solicitação de Compra"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Switch
                checked={requerAprovacao}
                onCheckedChange={setRequerAprovacao}
                id="requer-aprovacao"
              />
              <Label htmlFor="requer-aprovacao" className="text-sm whitespace-nowrap">
                Requer aprovação da diretoria
              </Label>
            </div>
            <Button onClick={handleAdd} disabled={isLoading} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {tipos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum tipo de chamado cadastrado.
          </p>
        ) : (
          tipos.map((tipo) => (
            <Card key={tipo.id_tipo_chamado}>
              <CardContent className="flex items-center justify-between gap-3 py-3 px-4">
                {editingId === tipo.id_tipo_chamado ? (
                  <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="flex-1"
                      maxLength={200}
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editRequer}
                        onCheckedChange={setEditRequer}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Aprovação</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={handleUpdate}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-medium truncate">{tipo.nome}</span>
                      {tipo.requer_aprovacao_diretoria && (
                        <Badge variant="warning" className="shrink-0 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Aprovação Diretoria
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(tipo)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover tipo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover "{tipo.nome}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(tipo.id_tipo_chamado)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
