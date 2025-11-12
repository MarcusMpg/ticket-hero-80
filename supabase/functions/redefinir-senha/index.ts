import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the requesting user is authenticated
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    // Check if the requesting user is an admin
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuario')
      .select('tipo_usuario')
      .eq('id_usuario', (await supabaseAdmin
        .from('profiles')
        .select('id_usuario')
        .eq('id', user.id)
        .single()).data?.id_usuario)
      .single();

    if (usuarioError || !usuarioData || usuarioData.tipo_usuario !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only admins can reset passwords' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the target user ID and new password from the request
    const { id_usuario, nova_senha } = await req.json();

    if (!id_usuario || !nova_senha) {
      throw new Error('Missing id_usuario or nova_senha');
    }

    if (nova_senha.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Get the auth user ID for the target user
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id_usuario', id_usuario)
      .single();

    if (profileError || !profileData) {
      throw new Error('User not found');
    }

    // Reset the password using Supabase Auth Admin API
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      profileData.id,
      { password: nova_senha }
    );

    if (resetError) {
      throw resetError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
