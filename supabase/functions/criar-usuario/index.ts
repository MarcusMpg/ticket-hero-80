import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verificar autenticação do requisitante
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      throw new Error('Não autorizado');
    }

    // Verificar se o usuário requisitante é admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id_usuario')
      .eq('id', requestingUser.id)
      .single();

    if (!profile?.id_usuario) {
      throw new Error('Perfil não encontrado');
    }

    const { data: usuario } = await supabaseAdmin
      .from('usuario')
      .select('tipo_usuario')
      .eq('id_usuario', profile.id_usuario)
      .single();

    if (!usuario || usuario.tipo_usuario !== 'ADMIN') {
      throw new Error('Apenas administradores podem cadastrar usuários');
    }

    // Dados do novo usuário
    const { email, password, nome, tipo_usuario, id_filial, id_setor } = await req.json();

    // Validar dados
    if (!email || !password || !nome || !tipo_usuario || !id_filial || !id_setor) {
      throw new Error('Dados incompletos');
    }

    if (password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }

    // Criar usuário no Auth
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createAuthError) {
      console.error('Erro ao criar usuário no Auth:', createAuthError);
      return new Response(
        JSON.stringify({
          success: false,
          error: createAuthError.message === 'A user with this email address has already been registered' 
            ? 'Este email já está cadastrado no sistema.' 
            : `Erro ao criar usuário: ${createAuthError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha ao criar usuário'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Criar registro na tabela usuario
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .insert({
        email,
        nome,
        tipo_usuario,
        id_filial,
        id_setor,
        senha_hash: 'supabase_auth',
        ativo: true
      })
      .select('id_usuario')
      .single();

    if (usuarioError) {
      // Se falhar, remover o usuário do auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erro ao criar registro de usuário: ${usuarioError.message}`);
    }

    // Vincular profile ao usuario
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ id_usuario: usuarioData.id_usuario })
      .eq('id', authData.user.id);

    if (profileError) {
      // Se falhar, limpar registros
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from('usuario').delete().eq('id_usuario', usuarioData.id_usuario);
      throw new Error(`Erro ao vincular perfil: ${profileError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário criado com sucesso',
        usuario: {
          id_usuario: usuarioData.id_usuario,
          email,
          nome,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
