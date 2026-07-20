import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import { JSON_HEADERS } from './http.ts';

export interface AuthenticatedContext {
  supabase: SupabaseClient;
  user: User;
  email: string;
}

export async function authenticateRequest(req: Request): Promise<AuthenticatedContext | Response> {
  const authorization: string | null = req.headers.get('Authorization');
  if (!authorization) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const supabase: SupabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user: User | null = userData.user;
  if (userError || !user || !user.email) {
    return new Response(JSON.stringify({ error: 'Unable to resolve authenticated user' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  return { supabase, user, email: user.email };
}
