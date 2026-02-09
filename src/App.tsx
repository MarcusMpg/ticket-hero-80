import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import TrocarSenha from "./pages/TrocarSenha";
import PrimeiroAcesso from "./pages/PrimeiroAcesso";
import AbrirChamado from "./pages/AbrirChamado";
import MeusChamados from "./pages/MeusChamados";
import PainelTI from "./pages/Painel";
import MeusAtendimentos from "./pages/MeusAtendimentos";
import DetalheChamado from "./pages/DetalheChamado";
import Estatisticas from "./pages/Estatisticas";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
            <Route
              path="/trocar-senha"
              element={
                <ProtectedRoute>
                  <TrocarSenha />
                </ProtectedRoute>
              }
            />
            <Route
              path="/abrir-chamado"
              element={
                <ProtectedRoute>
                  <AbrirChamado />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meus-chamados"
              element={
                <ProtectedRoute>
                  <MeusChamados />
                </ProtectedRoute>
              }
            />
            <Route
              path="/painel-ti"
              element={
                <ProtectedRoute>
                  <PainelTI />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meus-atendimentos"
              element={
                <ProtectedRoute>
                  <MeusAtendimentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/estatisticas"
              element={
                <ProtectedRoute>
                  <Estatisticas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chamado/:id"
              element={
                <ProtectedRoute>
                  <DetalheChamado />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
