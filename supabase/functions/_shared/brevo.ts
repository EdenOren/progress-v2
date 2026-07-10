const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export async function sendBrevoEmail(toEmail: string, subject: string, htmlContent: string): Promise<void> {
  const brevoApiKey: string | undefined = Deno.env.get('BREVO_API_KEY');
  const brevoFromEmail: string | undefined = Deno.env.get('BREVO_FROM_EMAIL');
  if (!brevoApiKey || !brevoFromEmail) {
    console.error('missing BREVO_API_KEY or BREVO_FROM_EMAIL secret');
    return;
  }

  const response: Response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': brevoApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: brevoFromEmail, name: 'Progress' },
      to: [{ email: toEmail }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    console.error(`Brevo API error ${response.status}: ${await response.text()}`);
  }
}
