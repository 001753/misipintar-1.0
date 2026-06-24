/**
 * SMTP Mailer — nodemailer over SSL (port 465)
 * Credentials live exclusively in Replit Secrets:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *
 * Never import credentials from code — always from process.env
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "[Mailer] SMTP_HOST, SMTP_USER, SMTP_PASS environment variables are required."
    );
  }

  // Port 465 → implicit TLS (secure: true)
  // Port 587 → STARTTLS (secure: false, requireTLS: true)
  const secure = port === 465;

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    // Reasonable timeouts for transactional mail
    connectionTimeout: 10_000,
    socketTimeout: 30_000,
    // Reject self-signed certs in production
    tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
  });

  return _transporter;
}

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
}

export async function sendMail(opts: SendMailOptions): Promise<void> {
  const transporter = getTransporter();
  const from = `"Misi Pintar" <${process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
}

/** Verify SMTP connectivity — call on startup diagnostics only */
export async function verifyMailer(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
