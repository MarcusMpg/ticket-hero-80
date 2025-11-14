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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Authorization header não encontrado');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authorization header não encontrado'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError) {
      console.error('Erro ao verificar autenticação:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao verificar autenticação'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    if (!requestingUser) {
      console.error('Usuário não encontrado');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Usuário não autenticado'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    console.log('Usuário autenticado:', requestingUser.id);

    // Verificar se o usuário requisitante é admin
    const { data: profile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id_usuario')
      .eq('id', requestingUser.id)
      .single();

    if (profileCheckError) {
      console.error('Erro ao buscar profile:', profileCheckError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao buscar perfil do usuário'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!profile?.id_usuario) {
      console.error('Profile sem id_usuario:', profile);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Perfil não vinculado a um usuário'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Profile encontrado, id_usuario:', profile.id_usuario);

    const { data: usuario, error: usuarioCheckError } = await supabaseAdmin
      .from('usuario')
      .select('tipo_usuario')
      .eq('id_usuario', profile.id_usuario)
      .single();

    if (usuarioCheckError) {
      console.error('Erro ao buscar usuário:', usuarioCheckError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao buscar dados do usuário'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!usuario) {
      console.error('Usuário não encontrado na tabela usuario');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Usuário não encontrado'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Usuário encontrado, tipo:', usuario.tipo_usuario);

    if (usuario.tipo_usuario !== 'ADMIN') {
      console.error('Usuário não é admin:', usuario.tipo_usuario);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Apenas administradores podem cadastrar usuários'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      );
    }

    // Dados do novo usuário
    const { email, password, nome, tipo_usuario, id_filial, id_setor } = await req.json();

    // Validar dados
    if (!email || !password || !nome || !tipo_usuario || !id_filial || !id_setor) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Dados incompletos'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'A senha deve ter pelo menos 6 caracteres'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Criando usuário no Auth com email:', email);

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

    console.log('Usuário criado no Auth, id:', authData.user.id);
    console.log('Criando registro na tabela usuario');

    // Criar registro na tabela usuario
    const { data: usuarioData, error: createUsuarioError } = await supabaseAdmin
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

    if (createUsuarioError) {
      console.error('Erro ao criar registro de usuário:', createUsuarioError);
      // Se falhar, remover o usuário do auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao criar registro de usuário: ${createUsuarioError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!usuarioData) {
      console.error('Falha ao criar usuário: usuarioData é null');
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Falha ao criar registro de usuário'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Registro criado na tabela usuario, id_usuario:', usuarioData.id_usuario);
    console.log('Vinculando profile ao usuario');

    // Vincular profile ao usuario
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ id_usuario: usuarioData.id_usuario })
      .eq('id', authData.user.id);

    if (updateProfileError) {
      console.error('Erro ao vincular perfil:', updateProfileError);
      // Se falhar, limpar registros
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from('usuario').delete().eq('id_usuario', usuarioData.id_usuario);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erro ao vincular perfil: ${updateProfileError.message}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log('Perfil vinculado com sucesso');

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
    console.error('Erro geral:', error);
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
