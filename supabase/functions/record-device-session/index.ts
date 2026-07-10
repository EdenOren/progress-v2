import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CORS_HEADERS, getRequestContext, hashFingerprint } from '../_shared/device.ts';
import { sendBrevoEmail } from '../_shared/brevo.ts';

function buildAlertEmailHtml(userAgent: string, ipAddress: string, signedInAt: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background-color: #7c3aed; padding: 24px 32px;">
        <span style="color: #ffffff; font-size: 18px; font-weight: 700;">Progress</span>
      </div>
      <div style="padding: 32px;">
        <p style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 700;">New sign-in to your account</p>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">
          We noticed a sign-in from a device we haven't seen before. If this was you, no action is needed.
        </p>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 6px; color: #111827; font-size: 14px;"><strong>Time:</strong> ${signedInAt}</p>
          <p style="margin: 0 0 6px; color: #111827; font-size: 14px;"><strong>Device:</strong> ${userAgent}</p>
          <p style="margin: 0; color: #111827; font-size: 14px;"><strong>IP address:</strong> ${ipAddress}</p>
        </div>
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 14px 18px; color: #92400e; font-size: 13px;">
          <strong>Wasn't you?</strong> Reset your password immediately to secure your account.
        </div>
      </div>
    </div>
  `;
}

async function sendNewDeviceEmail(toEmail: string, userAgent: string, ipAddress: string): Promise<void> {
  const signedInAt: string = new Date().toISOString();
  await sendBrevoEmail(
    toEmail,
    'New sign-in to your Progress account',
    buildAlertEmailHtml(userAgent, ipAddress, signedInAt),
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const jsonHeaders: Record<string, string> = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

  const authorization: string | null = req.headers.get('Authorization');
  if (!authorization) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user.email) {
    return new Response(JSON.stringify({ error: 'Unable to resolve authenticated user' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }
  const { user } = userData;

  const { userAgent, ipAddress } = getRequestContext(req);
  const fingerprintHash: string = await hashFingerprint(user.id, userAgent);

  const { data: existingSession, error: selectError } = await supabase
    .from('user_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('fingerprint_hash', fingerprintHash)
    .maybeSingle();

  if (selectError) {
    return new Response(JSON.stringify({ error: selectError.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  if (existingSession) {
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({ last_seen_at: new Date().toISOString(), last_ip_address: ipAddress })
      .eq('id', existingSession.id);
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: jsonHeaders,
      });
    }
    return new Response(JSON.stringify({ isNewDevice: false }), { headers: jsonHeaders });
  }

  const { error: insertError } = await supabase.from('user_sessions').insert({
    user_id: user.id,
    fingerprint_hash: fingerprintHash,
    user_agent: userAgent,
    last_ip_address: ipAddress,
  });
  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }

  await sendNewDeviceEmail(user.email, userAgent, ipAddress);

  return new Response(JSON.stringify({ isNewDevice: true }), { headers: jsonHeaders });
});
