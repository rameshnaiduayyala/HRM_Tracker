import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../shared/logger';

const S3_BUCKET = process.env.S3_BUCKET || 'tasktracky';
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || undefined, // Useful for MinIO: e.g. http://localhost:9000
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
  },
  forcePathStyle: true, // Required for MinIO compatibility
});

export class StorageService {
  async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
      logger.info(`File uploaded successfully to S3: ${key}`);
      return key;
    } catch (err: any) {
      logger.error(`S3 upload error: ${err.message}`);
      throw err;
    }
  }

  async getPresignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    } catch (err: any) {
      logger.error(`S3 signed URL generation error: ${err.message}`);
      throw err;
    }
  }
}

export const storageService = new StorageService();
export { s3Client };
