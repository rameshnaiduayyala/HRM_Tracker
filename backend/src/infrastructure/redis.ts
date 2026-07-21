import Redis from 'ioredis';
import { logger } from '../shared/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

redis.on('connect', () => {
  logger.info('Connected to Redis server');
});

redis.on('error', (err) => {
  logger.error(`Redis Error: ${err.message}`);
});

/**
 * Helper to get a tenant-scoped cache key
 */
export const getTenantKey = (tenantId: string, namespace: string, key: string) => {
  return `tenant:${tenantId}:${namespace}:${key}`;
};
