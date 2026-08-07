import { createRedisConnection } from "../queues/redis";
import { maxEmailsPerHour } from "../config";

const connection = createRedisConnection();

const HOURLY_KEY_PREFIX = "email_rate_hour";

export async function getCurrentHourKey(sender: string) {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  return `${HOURLY_KEY_PREFIX}:${sender}:${date.toISOString()}`;
}

export async function incrementHourlyCount(sender: string, amount = 1) {
  const key = await getCurrentHourKey(sender);
  const result = await connection.incrby(key, amount);

  if (result === amount) {
    const now = new Date();
    const secondsUntilHourEnd = 3600 - (now.getMinutes() * 60 + now.getSeconds());
    await connection.expire(key, secondsUntilHourEnd + 10);
  }

  return result;
}

export async function getHourlyCount(sender: string) {
  const key = await getCurrentHourKey(sender);
  const count = await connection.get(key);
  return Number(count || 0);
}

export function canSendNow(currentCount: number, hourlyLimit: number) {
  return currentCount < hourlyLimit;
}

export function getNextWindowDelay() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  return nextHour.getTime() - now.getTime();
}
