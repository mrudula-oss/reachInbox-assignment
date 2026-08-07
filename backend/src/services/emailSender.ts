import nodemailer from "nodemailer";
import { etherealUser, etherealPass, smtpHost, smtpPort } from "../config";

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function createTransporter() {
  if (etherealUser && etherealPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: etherealUser,
        pass: etherealPass,
      },
    });
  }

  const account = await nodemailer.createTestAccount();

  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
}

export async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
}

export type EmailSendPayload = {
  from: string;
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(payload: EmailSendPayload) {
  const transporter = await getTransporter();

  const result = await transporter.sendMail({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
  });

  return result;
}
