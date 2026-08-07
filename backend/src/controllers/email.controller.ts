import { Request, Response } from "express";
import { emailQueue } from "../queues/email.queue";
import prisma from "../prisma/client";
import { emailDelayMs, maxEmailsPerHour } from "../config";

export const healthCheck = (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "ReachInbox Email Scheduler Backend is Running 🚀",
  });
};

function normalizeRecipients(recipient: string | string[]) {
  if (Array.isArray(recipient)) {
    return recipient.map((r) => r.trim()).filter((email) => email.length > 0);
  }

  return recipient
    .split(/[,\n;]+/)
    .map((address) => address.trim())
    .filter((address) => address.length > 0);
}

export const scheduleEmail = async (req: Request, res: Response) => {
  const { recipient, subject, body, scheduledAt, sender, delayMs, hourlyLimit } = req.body;
  const authUser = (req as Request & { user?: any }).user;
  const resolvedSender = authUser?.user?.email || authUser?.email || sender;

  if (!recipient || !subject || !body || !scheduledAt || !resolvedSender) {
    return res.status(400).json({
      success: false,
      error: "recipient, subject, body, scheduledAt, and sender are required",
    });
  }

  const recipients = normalizeRecipients(recipient);
  if (recipients.length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one valid recipient email is required",
    });
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    return res.status(400).json({
      success: false,
      error: "scheduledAt must be a valid ISO datetime string",
    });
  }

  const resolvedDelayMs = Number.isNaN(Number(delayMs)) ? emailDelayMs : Number(delayMs);
  const resolvedHourlyLimit = Number.isNaN(Number(hourlyLimit)) ? maxEmailsPerHour : Number(hourlyLimit);
  const delay = Math.max(0, scheduledDate.getTime() - Date.now());

  const createdEmails = await Promise.all(
    recipients.map(async (recipientAddress) => {
      const email = await prisma.email.create({
        data: {
          recipient: recipientAddress,
          subject,
          body,
          sender: resolvedSender,
          scheduledAt: scheduledDate,
          delayMs: resolvedDelayMs,
          hourlyLimit: resolvedHourlyLimit,
        },
      });

      const job = await emailQueue.add("send-email", { emailId: email.id }, { delay });

      await prisma.email.update({
        where: { id: email.id },
        data: { jobId: job.id?.toString() ?? "" },
      });

      return { email, jobId: job.id };
    })
  );

  return res.status(201).json({ success: true, createdEmails });
};

export const getScheduledEmails = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: any }).user;
  const sender = authUser?.user?.email || authUser?.email;
  if (!sender) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const emails = await prisma.email.findMany({
    where: { status: "SCHEDULED", sender },
    orderBy: { scheduledAt: "asc" },
  });
  return res.status(200).json({ success: true, emails });
};

export const getSentEmails = async (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: any }).user;
  const sender = authUser?.user?.email || authUser?.email;
  if (!sender) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const emails = await prisma.email.findMany({
    where: { status: "SENT", sender },
    orderBy: { sentAt: "desc" },
  });
  return res.status(200).json({ success: true, emails });
};