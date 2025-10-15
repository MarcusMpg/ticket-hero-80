import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Filial {
  id_filial: number;
  nome_filial: string;
}

interface Setor {
  id_setor: number;
  nome_setor: string;
}

interface CadastrarUsuarioDialogProps {
  filiais: Filial[];
  setores: Setor[];
  onUsuarioCriado?: () => void;
}

export const CadastrarUsuarioDialog = ({ filiais, setores, onUsuarioCriado }: CadastrarUsuarioDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    tipo_usuario: "SOLICITANTE",
    id_filial: "",
    id_setor: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações
      if (!formData.nome || !formData.email || !formData.senha || !formData.id_filial || !formData.id_setor) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      if (formData.senha.length < 6) {
        toast({
          title: "Erro",
          description: "A senha deve ter pelo menos 6 caracteres.",
          variant: "destructive",
        });
        return;
      }

      // Criar usuário via edge function
      const { data, error } = await supabase.functions.invoke('criar-usuario', {
        body: {
          email: formData.email,
          password: formData.senha,
          nome: formData.nome,
          tipo_usuario: formData.tipo_usuario,
          id_filial: parseInt(formData.id_filial),
          id_setor: parseInt(formData.id_setor),
        },
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário cadastrado com sucesso!",
      });

      setFormData({
        nome: "",
        email: "",
        senha: "",
        tipo_usuario: "SOLICITANTE",
        id_filial: "",
        id_setor: "",
      });

      setOpen(false);
      onUsuarioCriado?.();
    } catch (error: any) {
      console.error("Erro ao cadastrar usuário:", error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível cadastrar o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Cadastrar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha *</Label>
            <Input
              id="senha"
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_usuario">Tipo de Usuário *</Label>
            <Select
              value={formData.tipo_usuario}
              onValueChange={(value) => setFormData({ ...formData, tipo_usuario: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOLICITANTE">Solicitante</SelectItem>
                <SelectItem value="ATENDENTE">Atendente (TI)</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_filial">Filial *</Label>
            <Select
              value={formData.id_filial}
              onValueChange={(value) => setFormData({ ...formData, id_filial: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a filial" />
              </SelectTrigger>
              <SelectContent>
                {filiais.map((filial) => (
                  <SelectItem key={filial.id_filial} value={filial.id_filial.toString()}>
                    {filial.nome_filial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_setor">Setor *</Label>
            <Select
              value={formData.id_setor}
              onValueChange={(value) => setFormData({ ...formData, id_setor: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {setores.map((setor) => (
                  <SelectItem key={setor.id_setor} value={setor.id_setor.toString()}>
                    {setor.nome_setor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
