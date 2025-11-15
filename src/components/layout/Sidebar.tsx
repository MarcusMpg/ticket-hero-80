import { Home, Ticket, ClipboardList, Users } from "lucide-react";
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
    { to: "/painel-ti", label: "Painel TI", icon: Home },
    { to: "/meus-atendimentos", label: "Meus Atendimentos", icon: Users },
  ];

  const links = (user?.eh_atendente || user?.eh_admin) ? atendenteLinks : solicitanteLinks;

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
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
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
