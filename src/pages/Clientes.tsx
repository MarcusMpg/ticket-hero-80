import { useEffect, useState } from "react";
import { z } from "zod";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, UserPlus } from "lucide-react";

const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Nome obrigatório").max(150),
  codigo_cliente: z.string().trim().min(1, "Código obrigatório").max(50),
});

interface Cliente {
  id_cliente: number;
  nome: string;
  codigo_cliente: string;
  ativo: boolean;
  data_cadastro: string;
}

export default function Clientes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = !!user?.eh_admin;

  const carregar = async () => {
    const { data, error } = await supabase
      .from("cliente")
      .select("*")
      .order("nome", { ascending: true });
    if (error) {
      toast({ title: "Erro ao carregar clientes", description: error.message, variant: "destructive" });
      return;
    }
    setClientes((data ?? []) as Cliente[]);
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = clienteSchema.safeParse({ nome, codigo_cliente: codigo });
    if (!parsed.success) {
      toast({
        title: "Dados inválidos",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("cliente").insert(parsed.data);
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente cadastrado com sucesso" });
    setNome("");
    setCodigo("");
    carregar();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este cliente?")) return;
    const { error } = await supabase.from("cliente").delete().eq("id_cliente", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente excluído" });
    carregar();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Cadastro de clientes</p>
        </div>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Novo Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    maxLength={150}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código do Cliente</Label>
                  <Input
                    id="codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    maxLength={50}
                    placeholder="Ex: CLI-0001"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Cadastrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Clientes Cadastrados ({clientes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clientes.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum cliente cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    {isAdmin && <TableHead className="w-20">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow key={c.id_cliente}>
                      <TableCell className="font-mono">{c.codigo_cliente}</TableCell>
                      <TableCell>{c.nome}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(c.id_cliente)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
