export interface EmailLayoutOptions {
  heading: string;
  message: string;
  contentHtml: string;
  warningLead: string;
  warningText: string;
}

export interface SecurityAlertEmailOptions {
  heading: string;
  message: string;
  userAgent: string;
  ipAddress: string;
  timestamp: string;
  warningText: string;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildEmailLayout(options: EmailLayoutOptions): string {
  const { heading, message, contentHtml, warningLead, warningText } = options;
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background-color: #7c3aed; padding: 24px 32px;">
        <span style="color: #ffffff; font-size: 18px; font-weight: 700;">Progress</span>
      </div>
      <div style="padding: 32px;">
        <p style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 700;">${heading}</p>
        <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px;">${message}</p>
        ${contentHtml}
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 14px 18px; color: #92400e; font-size: 13px;">
          <strong>${warningLead}</strong> ${warningText}
        </div>
      </div>
    </div>
  `;
}

export function buildSecurityAlertEmailHtml(options: SecurityAlertEmailOptions): string {
  const { heading, message, userAgent, ipAddress, timestamp, warningText } = options;
  const contextHtml = `<div style="background-color: #f9fafb; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 6px; color: #111827; font-size: 14px;"><strong>Time:</strong> ${escapeHtml(timestamp)}</p>
          <p style="margin: 0 0 6px; color: #111827; font-size: 14px;"><strong>Device:</strong> ${escapeHtml(userAgent)}</p>
          <p style="margin: 0; color: #111827; font-size: 14px;"><strong>IP address:</strong> ${escapeHtml(ipAddress)}</p>
        </div>`;
  return buildEmailLayout({
    heading,
    message,
    contentHtml: contextHtml,
    warningLead: 'Wasn\'t you?',
    warningText,
  });
}
