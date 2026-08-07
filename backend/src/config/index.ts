import dotenv from "dotenv";

dotenv.config();

export const port = Number(process.env.PORT || 5000);
export const redisHost = process.env.REDIS_HOST || "localhost";
export const redisPort = Number(process.env.REDIS_PORT || 6379);
export const workerConcurrency = Number(process.env.WORKER_CONCURRENCY || 5);
export const emailDelayMs = Number(process.env.EMAIL_DELAY_MS || 2000);
export const maxEmailsPerHour = Number(process.env.MAX_EMAILS_PER_HOUR || 200);
export const smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
export const smtpPort = Number(process.env.SMTP_PORT || 587);
export const etherealUser = process.env.ETHEREAL_USER;
export const etherealPass = process.env.ETHEREAL_PASS;
export const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
export const jwtSecret = process.env.JWT_SECRET || "reachbox-secret";
export const databaseUrl = process.env.DATABASE_URL;