import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/device.ts';
import { sha256Hex } from '../_shared/crypto.ts';
import { OTP_MAX_ATTEMPTS } from '../_shared/otp.ts';

interface VerifyRequestBody {
  challengeId: string;
  code: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const jsonHeaders: Record<string, string> = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

  let body: VerifyRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: jsonHeaders });
  }

  const { challengeId, code } = body;
  if (!challengeId || !code) {
    return new Response(JSON.stringify({ error: 'Challenge id and code are required' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: challenge, error: selectError } = await serviceClient
    .from('login_otp_challenges')
    .select(
      'id, user_id, fingerprint_hash, user_agent, ip_address, code_hash, access_token, refresh_token, attempt_count, expires_at',
    )
    .eq('id', challengeId)
    .maybeSingle();

  if (selectError) {
    return new Response(JSON.stringify({ error: selectError.message }), { status: 500, headers: jsonHeaders });
  }

  if (!challenge) {
    return new Response(JSON.stringify({ error: 'Invalid or expired code' }), { status: 400, headers: jsonHeaders });
  }

  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    await serviceClient.from('login_otp_challenges').delete().eq('id', challenge.id);
    return new Response(JSON.stringify({ error: 'Code expired, please sign in again' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  if (challenge.attempt_count >= OTP_MAX_ATTEMPTS) {
    await serviceClient.from('login_otp_challenges').delete().eq('id', challenge.id);
    return new Response(JSON.stringify({ error: 'Too many attempts, please sign in again' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const codeHash: string = await sha256Hex(code);
  if (codeHash !== challenge.code_hash) {
    await serviceClient
      .from('login_otp_challenges')
      .update({ attempt_count: challenge.attempt_count + 1 })
      .eq('id', challenge.id);
    return new Response(JSON.stringify({ error: 'Incorrect code' }), { status: 400, headers: jsonHeaders });
  }

  const { error: upsertError } = await serviceClient.from('user_sessions').upsert(
    {
      user_id: challenge.user_id,
      fingerprint_hash: challenge.fingerprint_hash,
      user_agent: challenge.user_agent,
      last_ip_address: challenge.ip_address,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,fingerprint_hash' },
  );

  if (upsertError) {
    return new Response(JSON.stringify({ error: upsertError.message }), { status: 500, headers: jsonHeaders });
  }

  await serviceClient.from('login_otp_challenges').delete().eq('id', challenge.id);

  return new Response(
    JSON.stringify({ accessToken: challenge.access_token, refreshToken: challenge.refresh_token }),
    { headers: jsonHeaders },
  );
});
