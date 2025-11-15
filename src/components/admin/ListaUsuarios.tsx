import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Building, Briefcase, Edit, Trash2, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  tipo_usuario: string;
  ativo: boolean;
  id_filial: number;
  id_setor: number | null;
  filial?: { nome_filial: string };
  setor?: { nome_setor: string };
}

interface Filial {
  id_filial: number;
  nome_filial: string;
}

interface Setor {
  id_setor: number;
  nome_setor: string;
}

interface ListaUsuariosProps {
  filiais?: Filial[];
  setores?: Setor[];
}

export const ListaUsuarios = ({ filiais = [], setores = [] }: ListaUsuariosProps) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    tipo_usuario: "",
    id_filial: "",
    id_setor: "",
    ativo: true,
  });
  const [novaSenha, setNovaSenha] = useState("");
  const [redefinindoSenha, setRedefinindoSenha] = useState<Usuario | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select(`
          id_usuario,
          nome,
          email,
          tipo_usuario,
          ativo,
          id_filial,
          id_setor,
          filial:filial(nome_filial),
          setor:setor(nome_setor)
        `)
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditarClick = (usuario: Usuario) => {
    setEditandoUsuario(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario,
      id_filial: usuario.id_filial.toString(),
      id_setor: usuario.id_setor?.toString() || "",
      ativo: usuario.ativo,
    });
  };

  const handleSalvarEdicao = async () => {
    if (!editandoUsuario) return;

    try {
      const { error } = await supabase
        .from('usuario')
        .update({
          nome: formData.nome,
          email: formData.email,
          tipo_usuario: formData.tipo_usuario,
          id_filial: parseInt(formData.id_filial),
          id_setor: formData.id_setor ? parseInt(formData.id_setor) : null,
          ativo: formData.ativo,
        })
        .eq('id_usuario', editandoUsuario.id_usuario);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      setEditandoUsuario(null);
      fetchUsuarios();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o usuário",
        variant: "destructive",
      });
    }
  };

  const handleRedefinirSenha = async () => {
    if (!redefinindoSenha || !novaSenha) return;

    if (novaSenha.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(
        `https://ojrqxpaiwksguurfzunh.supabase.co/functions/v1/redefinir-senha`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_usuario: redefinindoSenha.id_usuario,
            nova_senha: novaSenha,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao redefinir senha');
      }

      toast({
        title: "Sucesso",
        description: "Senha redefinida com sucesso!",
      });

      setRedefinindoSenha(null);
      setNovaSenha("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível redefinir a senha",
        variant: "destructive",
      });
    }
  };

  const handleExcluir = async (idUsuario: number) => {
    try {
      const { error } = await supabase
        .from('usuario')
        .delete()
        .eq('id_usuario', idUsuario);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso!",
      });

      fetchUsuarios();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o usuário",
        variant: "destructive",
      });
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      'ADMIN': 'Administrador',
      'ATENDENTE': 'Atendente',
      'SOLICITANTE': 'Solicitante',
    };
    return tipos[tipo] || tipo;
  };

  const getTipoVariant = (tipo: string): "default" | "secondary" | "destructive" | "outline" => {
    if (tipo === 'ADMIN') return 'destructive';
    if (tipo === 'ATENDENTE') return 'default';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  const ehAdmin = user?.eh_admin;

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {usuarios.map((usuario) => (
            <Card key={usuario.id_usuario} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <CardTitle className="text-sm sm:text-base truncate">{usuario.nome}</CardTitle>
                  </div>
                  <Badge 
                    variant={getTipoVariant(usuario.tipo_usuario)}
                    className="shrink-0 text-xs"
                  >
                    {getTipoLabel(usuario.tipo_usuario)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{usuario.email}</span>
                </div>
                
                {usuario.filial && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-4 w-4" />
                    <span>{usuario.filial.nome_filial}</span>
                  </div>
                )}
                
                {usuario.setor && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{usuario.setor.nome_setor}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Badge variant={usuario.ativo ? "success" : "secondary"}>
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                {ehAdmin && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditarClick(usuario)}
                      className="w-full"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRedefinindoSenha(usuario)}
                          className="w-full"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-lg">Redefinir Senha</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label className="text-sm">Usuário</Label>
                            <p className="text-sm text-muted-foreground">{usuario.nome}</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nova-senha" className="text-sm">Nova Senha</Label>
                            <Input
                              id="nova-senha"
                              type="password"
                              value={novaSenha}
                              onChange={(e) => setNovaSenha(e.target.value)}
                              placeholder="Mínimo 6 caracteres"
                              minLength={6}
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setRedefinindoSenha(null);
                                setNovaSenha("");
                              }}
                              className="w-full sm:w-auto"
                            >
                              Cancelar
                            </Button>
                            <Button onClick={handleRedefinirSenha} className="w-full sm:w-auto">
                              Redefinir
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="w-full">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o usuário {usuario.nome}? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleExcluir(usuario.id_usuario)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {usuarios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-muted-foreground">Nenhum usuário cadastrado</p>
          </div>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={!!editandoUsuario} onOpenChange={(open) => !open && setEditandoUsuario(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome" className="text-sm">Nome Completo</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-sm">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo de Usuário</Label>
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
              <Label htmlFor="edit-filial">Filial</Label>
              <Select
                value={formData.id_filial}
                onValueChange={(value) => setFormData({ ...formData, id_filial: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label htmlFor="edit-setor">Setor</Label>
              <Select
                value={formData.id_setor}
                onValueChange={(value) => setFormData({ ...formData, id_setor: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit-ativo">Usuário ativo</Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditandoUsuario(null)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button onClick={handleSalvarEdicao} className="w-full sm:w-auto">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
