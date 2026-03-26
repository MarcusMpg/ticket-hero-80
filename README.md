## sistema de chamados - Funcionalidades e Descrição

Este sistema é uma plataforma de gestão de chamados, voltada para equipes de TI e administração. As principais funcionalidades e áreas do sistema são:

### Funcionalidades Principais

- **Autenticação e Controle de Acesso**: Login, primeiro acesso, troca de senha, proteção de rotas e controle de permissões por tipo de usuário (admin, diretor, atendente, usuário comum).
- **Gestão de Chamados**: Abertura, acompanhamento, detalhamento, atribuição, interação, aprovação de diretoria, visualização de chamados por setor, prioridade e status.
- **Dashboard e Estatísticas**: Visualização de métricas, gráficos e indicadores de desempenho dos chamados.
- **Painel TI**: Área exclusiva para atendentes e administradores acompanharem chamados e atividades.
- **Gestão de Usuários**: Cadastro, edição, ativação/desativação, redefinição de senha e gerenciamento de tipos de usuário.
- **Gestão de Tipos de Chamado**: Cadastro, edição, ativação/desativação e definição de aprovação por diretoria.
- **Notificações por Email**: Envio automático de notificações para novos chamados usando EmailJS.
- **Integração com Supabase**: Autenticação, persistência de dados e consultas em tempo real.
- **Interface Responsiva**: Adaptação para dispositivos móveis, com componentes modernos e layout flexível.
- **Sistema de Toasts e Alertas**: Feedback visual para ações do usuário.

### Estrutura do Projeto

- **src/pages/**: Páginas principais do sistema (Login, Dashboard, Chamados, Painel, Estatísticas, etc).
- **src/components/**: Componentes reutilizáveis (cards, layouts, UI, admin, chamados).
- **src/contexts/**: Contexto de autenticação e controle global de usuário.
- **src/hooks/**: Hooks customizados para funcionalidades específicas (toast, mobile, chamados).
- **src/services/**: Serviços externos (email).
- **src/integrations/**: Integração com Supabase.
- **src/types/**: Tipos e interfaces para dados do sistema.
- **src/lib/**: Utilidades e funções auxiliares.

### Tecnologias Utilizadas

- React, TypeScript, Vite, TailwindCSS, Supabase, EmailJS, React Router, TanStack Query, Lucide Icons.

---

Esta seção pode ser expandida com detalhes de cada área, exemplos de uso e instruções de instalação conforme necessário.
