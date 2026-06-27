/**
 * SMTP Mailer — nodemailer over SSL (port 465)
 *
 * nodemailer di-require() secara lazy di dalam getTransporter() — BUKAN static import
 * di atas — karena static import menyebabkan nodemailer termuat saat build worker
 * mengevaluasi modul ini → SIGABRT saat "Collecting page data".
 */

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

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodemailer = require("nodemailer") as typeof import("nodemailer");

  const secure = port === 465;

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    socketTimeout: 30_000,
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

export async function verifyMailer(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return true;
  } catch {
    return false;
  }
}
