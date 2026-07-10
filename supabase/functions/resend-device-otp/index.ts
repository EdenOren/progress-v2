import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS } from '../_shared/device.ts';
import { generateNumericCode, sha256Hex } from '../_shared/crypto.ts';
import { sendBrevoEmail } from '../_shared/brevo.ts';
import { buildOtpEmailHtml, OTP_CODE_LENGTH, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from '../_shared/otp.ts';

interface ResendRequestBody {
  challengeId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const jsonHeaders: Record<string, string> = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

  let body: ResendRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: jsonHeaders });
  }

  const { challengeId } = body;
  if (!challengeId) {
    return new Response(JSON.stringify({ error: 'Challenge id is required' }), { status: 400, headers: jsonHeaders });
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: challenge, error: selectError } = await serviceClient
    .from('login_otp_challenges')
    .select('id, user_id, last_sent_at, expires_at')
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

  const secondsSinceLastSent: number = (Date.now() - new Date(challenge.last_sent_at).getTime()) / 1000;
  if (secondsSinceLastSent < OTP_RESEND_COOLDOWN_SECONDS) {
    return new Response(JSON.stringify({ error: 'Please wait before requesting another code' }), {
      status: 429,
      headers: jsonHeaders,
    });
  }

  const { data: userData, error: userError } = await serviceClient.auth.admin.getUserById(challenge.user_id);
  if (userError || !userData.user?.email) {
    return new Response(JSON.stringify({ error: 'Unable to resolve account email' }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  const code: string = generateNumericCode(OTP_CODE_LENGTH);
  const codeHash: string = await sha256Hex(code);
  const expiresAt: string = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000).toISOString();

  const { error: updateError } = await serviceClient
    .from('login_otp_challenges')
    .update({
      code_hash: codeHash,
      expires_at: expiresAt,
      attempt_count: 0,
      last_sent_at: new Date().toISOString(),
    })
    .eq('id', challenge.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: jsonHeaders });
  }

  await sendBrevoEmail(userData.user.email, 'Your new verification code', buildOtpEmailHtml(code));

  return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders });
});
