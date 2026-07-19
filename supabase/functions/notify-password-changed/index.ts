import { CORS_HEADERS, getRequestContext } from '../_shared/device.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import type { AuthenticatedContext } from '../_shared/auth.ts';
import { HttpMethod, JSON_HEADERS } from '../_shared/http.ts';
import { sendBrevoEmail } from '../_shared/brevo.ts';
import { buildSecurityAlertEmailHtml } from '../_shared/email-templates.ts';

async function sendPasswordChangedEmail(toEmail: string, userAgent: string, ipAddress: string): Promise<boolean> {
  const changedAt: string = new Date().toISOString();
  return sendBrevoEmail(
    toEmail,
    'Your Progress password was changed',
    buildSecurityAlertEmailHtml({
      heading: 'Your password was changed',
      message: 'Your Progress account password was just changed. If this was you, no action is needed.',
      userAgent,
      ipAddress,
      timestamp: changedAt,
      warningText: 'Reset your password immediately and contact support to secure your account.',
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

  const { userAgent, ipAddress } = getRequestContext(req);
  const emailSent: boolean = await sendPasswordChangedEmail(authContext.email, userAgent, ipAddress);
  if (!emailSent) {
    return new Response(JSON.stringify({ error: 'Failed to send notification email' }), {
      status: 502,
      headers: JSON_HEADERS,
    });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
});
