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

    const { nome_usuario } = await req.json();

    if (!nome_usuario) {
      return new Response(
        JSON.stringify({ success: false, error: 'nome_usuario é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const normalizedUsername = nome_usuario.toLowerCase().trim();
    const internalEmail = `${normalizedUsername}@internal.local`;

    console.log(`Normalizando usuário ${normalizedUsername} para email ${internalEmail}`);

    // Buscar usuário na tabela usuario
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .select('id_usuario, email')
      .eq('nome_usuario', normalizedUsername)
      .single();

    if (usuarioError || !usuario) {
      console.error('Usuário não encontrado:', usuarioError);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const oldEmail = usuario.email;
    console.log(`Email atual: ${oldEmail}, novo email: ${internalEmail}`);

    // Buscar o Auth user pelo email antigo
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao buscar usuário no Auth' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const authUser = authUsers.users.find(u => u.email === oldEmail);
    
    if (!authUser) {
      console.error('Usuário não encontrado no Auth com email:', oldEmail);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não encontrado no sistema de autenticação' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log('Auth user encontrado, id:', authUser.id);

    // Atualizar email no Auth
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      authUser.id,
      { email: internalEmail, email_confirm: true }
    );

    if (updateAuthError) {
      console.error('Erro ao atualizar email no Auth:', updateAuthError);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao atualizar autenticação: ${updateAuthError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Email atualizado no Auth');

    // Atualizar email na tabela usuario
    const { error: updateUsuarioError } = await supabaseAdmin
      .from('usuario')
      .update({ email: internalEmail })
      .eq('id_usuario', usuario.id_usuario);

    if (updateUsuarioError) {
      console.error('Erro ao atualizar email na tabela usuario:', updateUsuarioError);
      // Tentar reverter o Auth
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, { email: oldEmail });
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao atualizar registro: ${updateUsuarioError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Email atualizado na tabela usuario');

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuário ${normalizedUsername} normalizado com sucesso`,
        old_email: oldEmail,
        new_email: internalEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
