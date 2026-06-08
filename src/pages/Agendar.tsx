import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CalendarPlus, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { usePersistentState, clearPersistentState } from "@/hooks/usePersistentState";
import { cn } from "@/lib/utils";

interface Cliente {
  id_cliente: number;
  nome: string;
  codigo_cliente: string;
}

interface Agendamento {
  id_agendamento: number;
  numero_pedido: string;
  placa_veiculo: string | null;
  descricao_veiculo: string;
  carro_app: boolean;
  data_hora_agendamento: string;
  cliente?: { nome: string; codigo_cliente: string } | null;
}

const HORAS = Array.from({ length: 24 }, (_, i) => i);

const schema = z
  .object({
    id_cliente: z.number({ invalid_type_error: "Selecione um cliente" }).int().positive(),
    numero_pedido: z.string().trim().min(1, "Informe o número do pedido").max(50),
    descricao_veiculo: z.string().trim().min(1, "Informe a descrição do veículo").max(200),
    carro_app: z.boolean(),
    placa_veiculo: z.string().trim().max(20).optional(),
    data: z.date({ invalid_type_error: "Selecione a data" }),
    hora: z.number().int().min(0).max(23),
  })
  .refine((d) => d.carro_app || (d.placa_veiculo && d.placa_veiculo.length > 0), {
    message: "Informe a placa do veículo",
    path: ["placa_veiculo"],
  });

const STORAGE = "form:agendar";

export default function Agendar() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({}); // hora -> count
  const [loading, setLoading] = useState(false);

  const [idCliente, setIdCliente] = usePersistentState<string>(`${STORAGE}:cliente`, "");
  const [numeroPedido, setNumeroPedido] = usePersistentState<string>(`${STORAGE}:pedido`, "");
  const [placa, setPlaca] = usePersistentState<string>(`${STORAGE}:placa`, "");
  const [descricao, setDescricao] = usePersistentState<string>(`${STORAGE}:desc`, "");
  const [carroApp, setCarroApp] = usePersistentState<boolean>(`${STORAGE}:app`, false);
  const [dataStr, setDataStr] = usePersistentState<string>(`${STORAGE}:data`, "");
  const [hora, setHora] = usePersistentState<string>(`${STORAGE}:hora`, "");

  const dataSelecionada = useMemo(() => (dataStr ? new Date(dataStr) : undefined), [dataStr]);

  const carregarClientes = async () => {
    const { data } = await supabase
      .from("cliente")
      .select("id_cliente, nome, codigo_cliente")
      .eq("ativo", true)
      .order("nome");
    setClientes((data as Cliente[]) ?? []);
  };

  const carregarAgendamentos = async () => {
    const { data } = await supabase
      .from("agendamento")
      .select("*, cliente:id_cliente(nome, codigo_cliente)")
      .order("data_hora_agendamento", { ascending: true });
    setAgendamentos((data as any) ?? []);
  };

  const carregarContagem = async (d: Date) => {
    const inicio = new Date(d);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(d);
    fim.setHours(23, 59, 59, 999);
    const { data } = await supabase
      .from("agendamento")
      .select("data_hora_agendamento")
      .gte("data_hora_agendamento", inicio.toISOString())
      .lte("data_hora_agendamento", fim.toISOString());
    const map: Record<number, number> = {};
    (data ?? []).forEach((r: any) => {
      const h = new Date(r.data_hora_agendamento).getHours();
      map[h] = (map[h] ?? 0) + 1;
    });
    setCounts(map);
  };

  useEffect(() => {
    carregarClientes();
    carregarAgendamentos();
  }, []);

  useEffect(() => {
    if (dataSelecionada) carregarContagem(dataSelecionada);
    else setCounts({});
  }, [dataStr]);

  useEffect(() => {
    if (carroApp && placa) setPlaca("");
  }, [carroApp]);

  const agora = new Date();
  const hojeMeiaNoite = new Date();
  hojeMeiaNoite.setHours(0, 0, 0, 0);

  const horaDesabilitada = (h: number) => {
    if (!dataSelecionada) return true;
    if ((counts[h] ?? 0) >= 5) return true;
    const ehHoje = dataSelecionada.toDateString() === agora.toDateString();
    if (ehHoje && h <= agora.getHours()) return true;
    return false;
  };

  const limpar = () => {
    setIdCliente("");
    setNumeroPedido("");
    setPlaca("");
    setDescricao("");
    setCarroApp(false);
    setDataStr("");
    setHora("");
    [`${STORAGE}:cliente`, `${STORAGE}:pedido`, `${STORAGE}:placa`, `${STORAGE}:desc`, `${STORAGE}:app`, `${STORAGE}:data`, `${STORAGE}:hora`].forEach(clearPersistentState);
  };

  const salvar = async () => {
    const parsed = schema.safeParse({
      id_cliente: Number(idCliente),
      numero_pedido: numeroPedido,
      descricao_veiculo: descricao,
      carro_app: carroApp,
      placa_veiculo: carroApp ? undefined : placa,
      data: dataSelecionada as Date,
      hora: Number(hora),
    });
    if (!parsed.success) {
      toast({ title: "Dados inválidos", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    const dt = new Date(parsed.data.data);
    dt.setHours(parsed.data.hora, 0, 0, 0);
    if (dt < new Date()) {
      toast({ title: "Data inválida", description: "Selecione uma data/hora futura.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("agendamento").insert({
      id_cliente: parsed.data.id_cliente,
      numero_pedido: parsed.data.numero_pedido,
      placa_veiculo: parsed.data.carro_app ? null : parsed.data.placa_veiculo,
      descricao_veiculo: parsed.data.descricao_veiculo,
      carro_app: parsed.data.carro_app,
      data_hora_agendamento: dt.toISOString(),
      id_usuario_criador: user?.id_usuario ?? null,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao agendar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Agendamento criado com sucesso!" });
    limpar();
    carregarAgendamentos();
  };

  const excluir = async (id: number) => {
    if (!confirm("Excluir este agendamento?")) return;
    const { error } = await supabase.from("agendamento").delete().eq("id_agendamento", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Agendamento excluído" });
    carregarAgendamentos();
    if (dataSelecionada) carregarContagem(dataSelecionada);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Agendar</h1>
          <p className="text-muted-foreground">Crie agendamentos para clientes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" /> Novo Agendamento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={idCliente} onValueChange={setIdCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id_cliente} value={String(c.id_cliente)}>
                      {c.codigo_cliente} — {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Número do Pedido *</Label>
              <Input value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)} placeholder="Ex: 12345" />
            </div>

            <div className="space-y-2">
              <Label>Placa do Veículo {!carroApp && "*"}</Label>
              <Input
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                disabled={carroApp}
                placeholder={carroApp ? "Desabilitado (Carro de App)" : "ABC-1D23"}
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição do Veículo *</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Fiat Uno branco" />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox id="carroApp" checked={carroApp} onCheckedChange={(v) => setCarroApp(!!v)} />
              <Label htmlFor="carroApp" className="cursor-pointer">Carro de App (desabilita campo de placa)</Label>
            </div>

            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dataSelecionada && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataSelecionada ? format(dataSelecionada, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataSelecionada}
                    onSelect={(d) => {
                      setDataStr(d ? d.toISOString() : "");
                      setHora("");
                    }}
                    disabled={(d) => d < hojeMeiaNoite}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Horário *</Label>
              <Select value={hora} onValueChange={setHora} disabled={!dataSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder={dataSelecionada ? "Selecione o horário" : "Escolha uma data primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {HORAS.map((h) => {
                    const disabled = horaDesabilitada(h);
                    const used = counts[h] ?? 0;
                    return (
                      <SelectItem key={h} value={String(h)} disabled={disabled}>
                        {String(h).padStart(2, "0")}:00 {used >= 5 ? "(lotado)" : `(${used}/5)`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex gap-2 justify-end">
              <Button variant="outline" onClick={limpar} disabled={loading}>Limpar</Button>
              <Button onClick={salvar} disabled={loading}>{loading ? "Salvando..." : "Agendar"}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>App</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentos.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum agendamento</TableCell></TableRow>
                )}
                {agendamentos.map((a) => (
                  <TableRow key={a.id_agendamento}>
                    <TableCell>{format(new Date(a.data_hora_agendamento), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell>{a.cliente?.nome ?? "-"}</TableCell>
                    <TableCell>{a.numero_pedido}</TableCell>
                    <TableCell>{a.placa_veiculo ?? "-"}</TableCell>
                    <TableCell>{a.descricao_veiculo}</TableCell>
                    <TableCell>{a.carro_app ? "Sim" : "Não"}</TableCell>
                    <TableCell>
                      {user?.eh_admin && (
                        <Button variant="ghost" size="icon" onClick={() => excluir(a.id_agendamento)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
