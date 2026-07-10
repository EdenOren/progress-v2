import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS, getRequestContext, hashFingerprint } from '../_shared/device.ts';
import { generateNumericCode, sha256Hex } from '../_shared/crypto.ts';
import { sendBrevoEmail } from '../_shared/brevo.ts';
import { buildOtpEmailHtml, OTP_CODE_LENGTH, OTP_EXPIRY_MINUTES } from '../_shared/otp.ts';

interface LoginRequestBody {
  email: string;
  password: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const jsonHeaders: Record<string, string> = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

  let body: LoginRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: jsonHeaders });
  }

  const { email, password } = body;
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password are required' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
  if (signInError || !signInData.session) {
    return new Response(JSON.stringify({ error: signInError?.message ?? 'Invalid login credentials' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const { user, session } = signInData;
  if (!user.email) {
    return new Response(JSON.stringify({ error: 'Unable to resolve account email' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  const { userAgent, ipAddress } = getRequestContext(req);
  const fingerprintHash: string = await hashFingerprint(user.id, userAgent);

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: existingSession, error: selectError } = await serviceClient
    .from('user_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('fingerprint_hash', fingerprintHash)
    .maybeSingle();

  if (selectError) {
    return new Response(JSON.stringify({ error: selectError.message }), { status: 500, headers: jsonHeaders });
  }

  if (existingSession) {
    const { error: updateError } = await serviceClient
      .from('user_sessions')
      .update({ last_seen_at: new Date().toISOString(), last_ip_address: ipAddress })
      .eq('id', existingSession.id);
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: jsonHeaders });
    }
    return new Response(
      JSON.stringify({
        requiresOtp: false,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      }),
      { headers: jsonHeaders },
    );
  }

  const code: string = generateNumericCode(OTP_CODE_LENGTH);
  const codeHash: string = await sha256Hex(code);
  const expiresAt: string = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000).toISOString();

  const { data: challenge, error: insertError } = await serviceClient
    .from('login_otp_challenges')
    .insert({
      user_id: user.id,
      fingerprint_hash: fingerprintHash,
      user_agent: userAgent,
      ip_address: ipAddress,
      code_hash: codeHash,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (insertError || !challenge) {
    return new Response(JSON.stringify({ error: insertError?.message ?? 'Failed to start verification' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  await sendBrevoEmail(user.email, 'Verify this device to finish signing in', buildOtpEmailHtml(code));

  return new Response(JSON.stringify({ requiresOtp: true, challengeId: challenge.id }), { headers: jsonHeaders });
});
