import { buildEmailLayout } from './email-templates.ts';

export const OTP_CODE_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 120;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function buildOtpEmailHtml(code: string): string {
  const codeHtml = `<div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
          <span style="color: #111827; font-size: 32px; font-weight: 700; letter-spacing: 8px;">${code}</span>
        </div>`;
  return buildEmailLayout({
    heading: 'Verify this device',
    message: `Enter this code to finish signing in from a new device. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    contentHtml: codeHtml,
    warningLead: 'Didn\'t try to sign in?',
    warningText: 'Ignore this email and consider resetting your password.',
  });
}
