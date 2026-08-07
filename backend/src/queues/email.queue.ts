import { Job, Queue } from "bullmq";
import { createRedisConnection } from "./redis";
import prisma from "../prisma/client";
import { sendEmail } from "../services/emailSender";

export type EmailQueueResult = Job<any, any, string> | { id: string };
export type EmailQueueHandler = {
  add: (name: string, data: any, opts?: { delay?: number }) => Promise<EmailQueueResult>;
};

export const emailQueueName = "email-scheduler-queue";

const createFallbackQueue = (): EmailQueueHandler => {
  return {
    add: async (name: string, data: any, opts: { delay?: number } = {}) => {
      const jobId = `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const delay = opts.delay ?? 0;

      setTimeout(async () => {
        try {
          const email = await prisma.email.findUnique({ where: { id: data.emailId } });
          if (!email || email.status === "SENT") {
            return;
          }

          await sendEmail({
            from: email.sender,
            to: email.recipient,
            subject: email.subject,
            text: email.body,
          });

          await prisma.email.update({
            where: { id: data.emailId },
            data: {
              status: "SENT",
              sentAt: new Date(),
            },
          });
          console.log(`[fallback queue] sent email ${data.emailId}`);
        } catch (error) {
          console.error("[fallback queue] sendEmail failed", error);
        }
      }, delay);

      return { id: jobId };
    },
  };
};

let bullQueue: Queue | null = null;
let emailQueue = createFallbackQueue();

const initQueue = async () => {
  const redis = createRedisConnection();
  try {
    await redis.connect();
    await redis.ping();

    bullQueue = new Queue(emailQueueName, {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 1000,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 10000,
        },
      },
    });

    emailQueue = {
      add: async (name: string, data: any, opts: { delay?: number } = {}) => {
        try {
          return await bullQueue!.add(name, data, opts);
        } catch (error) {
          console.warn("BullMQ queue failed, using fallback queue:", error);
          bullQueue = null;
          return createFallbackQueue().add(name, data, opts);
        }
      },
    } as EmailQueueHandler;
  } catch (error) {
    console.warn("Redis queue initialization failed, falling back to in-memory scheduling:", error);
    try {
      await redis.disconnect();
    } catch (disconnectError) {
      // ignore disconnect failures during fallback cleanup
      console.warn("Redis disconnect failed during fallback cleanup:", disconnectError);
    }
  }
};

void initQueue();

export { emailQueue };
