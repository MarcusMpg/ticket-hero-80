import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create client with user's token for authorization check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Sem header de autorização');
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the requesting user
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requestingUser) {
      console.error('Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Usuário autenticado:', requestingUser.id);

    // Check if requesting user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id_usuario')
      .eq('id', requestingUser.id)
      .maybeSingle();

    if (profileError || !profile?.id_usuario) {
      console.error('Erro ao buscar profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('usuario')
      .select('tipo_usuario')
      .eq('id_usuario', profile.id_usuario)
      .single();

    if (adminError || adminUser?.tipo_usuario !== 'ADMIN') {
      console.error('Usuário não é admin:', adminError);
      return new Response(
        JSON.stringify({ success: false, error: 'Apenas administradores podem excluir usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verificado');

    // Get request body
    const { id_usuario } = await req.json();

    if (!id_usuario) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID do usuário é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deletando usuário id_usuario:', id_usuario);

    // Get the auth user ID from profiles table
    const { data: targetProfile, error: targetProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id_usuario', id_usuario)
      .maybeSingle();

    if (targetProfileError) {
      console.error('Erro ao buscar profile do usuário alvo:', targetProfileError);
    }

    const authUserId = targetProfile?.id;
    console.log('Auth user ID encontrado:', authUserId);

    // Delete from usuario table first (this will cascade to chamados, etc.)
    const { error: deleteUsuarioError } = await supabaseAdmin
      .from('usuario')
      .delete()
      .eq('id_usuario', id_usuario);

    if (deleteUsuarioError) {
      console.error('Erro ao deletar da tabela usuario:', deleteUsuarioError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao excluir usuário: ' + deleteUsuarioError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Usuário deletado da tabela usuario');

    // Delete from profiles table
    if (authUserId) {
      const { error: deleteProfileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', authUserId);

      if (deleteProfileError) {
        console.error('Erro ao deletar profile:', deleteProfileError);
        // Continue even if profile deletion fails
      } else {
        console.log('Profile deletado');
      }

      // Delete from Supabase Auth
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);

      if (deleteAuthError) {
        console.error('Erro ao deletar do Auth:', deleteAuthError);
        // Continue even if auth deletion fails - the main user data is already gone
      } else {
        console.log('Usuário deletado do Supabase Auth');
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Usuário excluído completamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro interno:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});