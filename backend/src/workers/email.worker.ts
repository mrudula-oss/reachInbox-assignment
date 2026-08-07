import { Worker, Job } from "bullmq";
import { createRedisConnection } from "../queues/redis";
import { emailQueueName } from "../queues/email.queue";
import { workerConcurrency, emailDelayMs } from "../config";
import { sendEmail } from "../services/emailSender";
import prisma from "../prisma/client";
import { getHourlyCount, incrementHourlyCount, canSendNow, getNextWindowDelay } from "../services/rateLimiter";

export let emailWorker: Worker | null = null;

const initWorker = async () => {
  const redis = createRedisConnection();

  try {
    await redis.connect();
    await redis.ping();

    emailWorker = new Worker(
      emailQueueName,
      async (job: Job) => {
        const emailId = job.data.emailId as string;
        const email = await prisma.email.findUnique({ where: { id: emailId } });

        if (!email) {
          throw new Error(`Email record not found for job ${job.id}`);
        }

        if (email.status === "SENT") {
          return { skip: true };
        }

        const currentCount = await getHourlyCount(email.sender);
        const hourlyLimit = email.hourlyLimit ?? Number(process.env.MAX_EMAILS_PER_HOUR || 200);
        if (!canSendNow(currentCount, hourlyLimit)) {
          const nextDelayMs = getNextWindowDelay();
          if (!job.token) {
            throw new Error("Missing job token for rescheduling");
          }
          await job.moveToDelayed(Date.now() + nextDelayMs, job.token);
          return { delayed: true, nextRunInMs: nextDelayMs };
        }

        await sendEmail({
          from: email.sender,
          to: email.recipient,
          subject: email.subject,
          text: email.body,
        });

        await incrementHourlyCount(email.sender, 1);

        await prisma.email.update({
          where: { id: emailId },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        });

        return { success: true };
      },
      {
        connection: redis,
        concurrency: workerConcurrency,
        lockDuration: 600000,
        limiter: {
          max: 1,
          duration: emailDelayMs,
        },
      }
    );

    emailWorker.on("completed", (job) => {
      console.log(`Email job completed: ${job.id}`);
    });

    emailWorker.on("failed", (job, err) => {
      console.error(`Email job failed: ${job?.id}`, err);
    });
  } catch (error) {
    console.warn("Redis worker initialization failed, email worker disabled:", error);
    try {
      await redis.disconnect();
    } catch {
      // ignore disconnect failures during fallback cleanup
    }
  }
};

initWorker();
