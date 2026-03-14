// src/lib/email.ts
// Email service for delivering download links after purchase

interface SendDownloadEmailOptions {
  to: string;
  customerName?: string;
  productName: string;
  downloadUrl: string;
  expiresAt: Date;
  appUrl: string;
  emailConfig: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

/**
 * Send download link email via SMTP (Resend, SendGrid, or any SMTP provider).
 * Uses fetch to call Resend API directly — works in Edge runtime.
 */
export async function sendDownloadEmail(
  opts: SendDownloadEmailOptions,
  resendApiKey?: string
): Promise<boolean> {
  // Option 1: Use Resend API (recommended for edge environments)
  if (resendApiKey) {
    return sendViaResend(opts, resendApiKey);
  }

  // Option 2: Use SMTP (Node.js runtime only)
  return sendViaSmtp(opts);
}

async function sendViaResend(
  opts: SendDownloadEmailOptions,
  apiKey: string
): Promise<boolean> {
  const expiresFormatted = opts.expiresAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  });

  const html = buildEmailHtml({
    customerName: opts.customerName,
    productName: opts.productName,
    downloadUrl: opts.downloadUrl,
    expiresFormatted,
    appUrl: opts.appUrl,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Digital Marketplace <noreply@${new URL(opts.appUrl).hostname}>`,
      to: [opts.to],
      subject: `Your download is ready: ${opts.productName}`,
      html,
    }),
  });

  return response.ok;
}

async function sendViaSmtp(opts: SendDownloadEmailOptions): Promise<boolean> {
  try {
    // Dynamic import to avoid edge runtime issues
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: opts.emailConfig.host,
      port: opts.emailConfig.port,
      secure: opts.emailConfig.port === 465,
      auth: { user: opts.emailConfig.user, pass: opts.emailConfig.pass },
    });

    const expiresFormatted = opts.expiresAt.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "UTC",
    });

    await transporter.sendMail({
      from: `"Digital Marketplace" <${opts.emailConfig.user}>`,
      to: opts.to,
      subject: `Your download is ready: ${opts.productName}`,
      html: buildEmailHtml({
        customerName: opts.customerName,
        productName: opts.productName,
        downloadUrl: opts.downloadUrl,
        expiresFormatted,
        appUrl: opts.appUrl,
      }),
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

function buildEmailHtml(data: {
  customerName?: string;
  productName: string;
  downloadUrl: string;
  expiresFormatted: string;
  appUrl: string;
}): string {
  const name = data.customerName ? `, ${data.customerName}` : "";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Download Is Ready</title>
</head>
<body style="margin:0;padding:0;background:#06060e;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#0e0e1e;border-radius:16px;border:1px solid rgba(245,158,11,0.2);overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#18182e,#24243e);padding:32px 40px;border-bottom:1px solid rgba(245,158,11,0.15);">
              <h1 style="margin:0;color:#f59e0b;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                ◆ VAULT
              </h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:12px;letter-spacing:2px;text-transform:uppercase;">
                Digital Marketplace
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:600;">
                Your download is ready${name}
              </h2>
              <p style="margin:0 0 24px;color:rgba(255,255,255,0.5);font-size:15px;line-height:1.6;">
                Thank you for your purchase. Your file is ready to download securely.
              </p>
              <!-- Product box -->
              <div style="background:rgba(245,158,11,0.05);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:20px;margin-bottom:28px;">
                <p style="margin:0 0 4px;color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Product</p>
                <p style="margin:0;color:#ffffff;font-size:17px;font-weight:600;">${data.productName}</p>
              </div>
              <!-- CTA button -->
              <a href="${data.downloadUrl}"
                 style="display:block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000000;text-decoration:none;text-align:center;padding:16px 32px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.5px;margin-bottom:24px;">
                ↓ Download Your File
              </a>
              <!-- Expiry warning -->
              <div style="background:rgba(255,100,0,0.08);border:1px solid rgba(255,100,0,0.2);border-radius:8px;padding:16px;margin-bottom:28px;">
                <p style="margin:0;color:rgba(255,150,50,0.9);font-size:13px;line-height:1.5;">
                  <strong>⚠ Important:</strong> This download link expires on <strong>${data.expiresFormatted} UTC</strong> and is limited to 3 downloads. Please save your file immediately.
                </p>
              </div>
              <!-- Help text -->
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:13px;line-height:1.6;">
                Having trouble? The button link is:<br>
                <a href="${data.downloadUrl}" style="color:rgba(245,158,11,0.7);word-break:break-all;">${data.downloadUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;color:rgba(255,255,255,0.2);font-size:12px;line-height:1.6;text-align:center;">
                © ${new Date().getFullYear()} VAULT Digital Marketplace · <a href="${data.appUrl}" style="color:rgba(245,158,11,0.4);">vault.digital</a><br>
                You received this because you made a purchase. No spam.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
