export const OTP_CODE_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 120;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function buildOtpEmailHtml(code: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background-color: #7c3aed; padding: 24px 32px;">
        <span style="color: #ffffff; font-size: 18px; font-weight: 700;">Progress</span>
      </div>
      <div style="padding: 32px;">
        <p style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 700;">Verify this device</p>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">
          Enter this code to finish signing in from a new device. It expires in ${OTP_EXPIRY_MINUTES} minutes.
        </p>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center;">
          <span style="color: #111827; font-size: 32px; font-weight: 700; letter-spacing: 8px;">${code}</span>
        </div>
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 14px 18px; color: #92400e; font-size: 13px;">
          <strong>Didn't try to sign in?</strong> Ignore this email and consider resetting your password.
        </div>
      </div>
    </div>
  `;
}
