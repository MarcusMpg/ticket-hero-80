import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  tipo_usuario: string;
  id_setor: number;
  id_filial: number;
  ativo: boolean;
}

export interface User extends Usuario {
  authId: string;
  eh_atendente: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, userData: Omit<Usuario, 'id_usuario'>) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Defer Supabase calls to avoid deadlocks in the callback
        setTimeout(() => {
          loadUserData(session.user.id);
        }, 0);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Then check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setTimeout(() => {
          loadUserData(session.user.id);
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authId: string) => {
    try {
      setIsLoading(true);
      
      // Get profile with usuario data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id_usuario')
        .eq('id', authId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw profileError;
      }
      
      if (!profile?.id_usuario) {
        console.log('No profile found for user');
        return;
      }

      // Get usuario data
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', profile.id_usuario)
        .single();

      if (usuarioError) {
        console.error('Usuario error:', usuarioError);
        throw usuarioError;
      }

      setUser({
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
        id_setor: usuario.id_filial || 1,
        id_filial: usuario.id_filial,
        ativo: usuario.ativo,
        authId,
        eh_atendente: usuario.tipo_usuario === 'atendente'
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signup = async (email: string, password: string, userData: Omit<Usuario, 'id_usuario'>) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (authError) return { error: authError };
      if (!authData.user) return { error: new Error('Failed to create user') };

      // Create usuario record
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuario')
        .insert({
          email: userData.email,
          nome: userData.nome,
          tipo_usuario: userData.tipo_usuario,
          id_setor: userData.id_setor,
          id_filial: userData.id_filial,
          senha_hash: 'supabase_auth', // Placeholder since we use Supabase auth
          ativo: userData.ativo
        })
        .select('id_usuario')
        .single();

      if (usuarioError) return { error: usuarioError };

      // Link profile to usuario
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ id_usuario: usuarioData.id_usuario })
        .eq('id', authData.user.id);

      if (profileError) return { error: profileError };

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    isAuthenticated: !!session,
    login,
    signup,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
