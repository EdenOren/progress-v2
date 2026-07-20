import { CORS_HEADERS, getRequestContext, hashFingerprint } from '../_shared/device.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import type { AuthenticatedContext } from '../_shared/auth.ts';
import { HttpMethod, JSON_HEADERS } from '../_shared/http.ts';
import { sendBrevoEmail } from '../_shared/brevo.ts';
import { buildSecurityAlertEmailHtml } from '../_shared/email-templates.ts';

async function sendNewDeviceEmail(toEmail: string, userAgent: string, ipAddress: string): Promise<boolean> {
  const signedInAt: string = new Date().toISOString();
  return sendBrevoEmail(
    toEmail,
    'New sign-in to your Progress account',
    buildSecurityAlertEmailHtml({
      heading: 'New sign-in to your account',
      message: 'We noticed a sign-in from a device we haven\'t seen before. If this was you, no action is needed.',
      userAgent,
      ipAddress,
      timestamp: signedInAt,
      warningText: 'Reset your password immediately to secure your account.',
    }),
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === HttpMethod.Options) {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const authContext: AuthenticatedContext | Response = await authenticateRequest(req);
  if (authContext instanceof Response) {
    return authContext;
  }
  const { supabase, user, email } = authContext;

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
      headers: JSON_HEADERS,
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
        headers: JSON_HEADERS,
      });
    }
    return new Response(JSON.stringify({ isNewDevice: false }), { headers: JSON_HEADERS });
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
      headers: JSON_HEADERS,
    });
  }

  const alertEmailSent: boolean = await sendNewDeviceEmail(email, userAgent, ipAddress);

  return new Response(JSON.stringify({ isNewDevice: true, alertEmailSent }), { headers: JSON_HEADERS });
});
