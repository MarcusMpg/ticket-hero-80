import {
  Home,
  Ticket,
  ClipboardList,
  Users,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { user } = useAuth();

  const solicitanteLinks = [
    { to: "/abrir-chamado", label: "Novo Chamado", icon: Ticket },
    { to: "/meus-chamados", label: "Meus Chamados", icon: ClipboardList },
  ];

  const atendenteLinks = [
    { to: "/painel-ti", label: "Painel", icon: Home },
    { to: "/meus-atendimentos", label: "Meus Atendimentos", icon: Users },
    { to: "/abrir-chamado", label: "Novo Chamado", icon: Ticket },
    { to: "/meus-chamados", label: "Meus Chamados", icon: ClipboardList },
    { to: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
  ];

  const diretorLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/painel-ti", label: "Todos Chamados", icon: Home },
    { to: "/abrir-chamado", label: "Novo Chamado", icon: Ticket },
    { to: "/meus-chamados", label: "Meus Chamados", icon: ClipboardList },
    { to: "/estatisticas", label: "Estatísticas", icon: BarChart3 },
  ];

  let links = solicitanteLinks;
  if (user?.eh_admin) {
    links = [
      ...atendenteLinks,
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ];
  } else if (user?.eh_diretor) {
    links = diretorLinks;
  } else if (user?.eh_atendente) {
    links = atendenteLinks;
  }

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r bg-sidebar">
      <nav className="flex flex-col gap-1 p-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              )
            }
          >
            <link.icon className="h-5 w-5" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
