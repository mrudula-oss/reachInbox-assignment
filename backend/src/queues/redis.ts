import { Redis, RedisOptions } from "ioredis";
import { redisHost, redisPort } from "../config";

const redisOptions: RedisOptions = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 100, 2000),
  lazyConnect: true,
  connectTimeout: 10000,
  enableAutoPipelining: false,
};

export const createRedisConnection = () => new Redis(redisOptions);
export const connection = createRedisConnection();
