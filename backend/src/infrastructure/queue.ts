import { Queue } from 'bullmq';
import { redis } from './redis';
import { logger } from '../shared/logger';

// Standard connection options mapping Redis instance
const connection = redis;

// Define available queues
export const screenshotQueue = new Queue('screenshot-processing', { connection });
export const emailQueue = new Queue('email-delivery', { connection });
export const reportQueue = new Queue('report-generation', { connection });
export const cleanupQueue = new Queue('data-cleanup', { connection });

logger.info('BullMQ Queues initialized');

// Helper to push jobs
export const addJob = async (
  queue: Queue,
  name: string,
  data: any,
  options?: any
) => {
  try {
    const job = await queue.add(name, data, options);
    logger.debug(`Job added to queue ${queue.name}: ID ${job.id}`);
    return job;
  } catch (err: any) {
    logger.error(`Error adding job to queue ${queue.name}: ${err.message}`);
    throw err;
  }
};
