import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (request) => {
  const siteUrlValue = Deno.env.get('SITE_URL');
  let allowedOrigin: string;
  try {
    allowedOrigin = new URL(siteUrlValue ?? '').origin;
  } catch {
    return Response.json({ error: 'Account deletion is not configured.' }, { status: 503 });
  }

  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    if (origin !== allowedOrigin) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': origin,
        'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
        'access-control-allow-methods': 'DELETE, OPTIONS',
        vary: 'Origin'
      }
    });
  }

  if (request.method !== 'DELETE') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  }

  const origin = request.headers.get('origin');
  if (!origin || origin !== allowedOrigin) {
    return Response.json({ error: 'Origin not allowed.' }, { status: 403 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('authorization');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization?.startsWith('Bearer ')) {
    return Response.json({ error: 'Account deletion is not configured.' }, { status: 503 });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: { headers: { authorization } }
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: 'A valid signed-in session is required.' }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('Account deletion failed:', deleteError.message);
    return Response.json({ error: 'The account could not be deleted. Please contact support.' }, { status: 500 });
  }

  return Response.json(
    { deleted: true },
    {
      status: 200,
      headers: {
        'access-control-allow-origin': origin,
        vary: 'Origin'
      }
    }
  );
});
