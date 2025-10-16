import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Building, Briefcase } from "lucide-react";

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  tipo_usuario: string;
  ativo: boolean;
  filial?: { nome_filial: string };
  setor?: { nome_setor: string };
}

export const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {usuarios.map((usuario) => (
          <Card key={usuario.id_usuario} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{usuario.nome}</CardTitle>
                </div>
                <Badge 
                  variant={getTipoVariant(usuario.tipo_usuario)}
                  className="shrink-0"
                >
                  {getTipoLabel(usuario.tipo_usuario)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
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
  );
};
