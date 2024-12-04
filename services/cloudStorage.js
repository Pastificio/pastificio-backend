import AWS from 'aws-sdk';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import logger from '../config/logger.js';

class CloudStorageService {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
    this.bucketName = process.env.AWS_BUCKET_NAME;
  }

  async uploadBackup(filename) {
    try {
      const filePath = join(process.cwd(), 'backups', filename);
      const fileStream = createReadStream(filePath);

      const uploadParams = {
        Bucket: this.bucketName,
        Key: `backups/${filename}`,
        Body: fileStream
      };

      const result = await this.s3.upload(uploadParams).promise();
      logger.info(`Backup caricato su S3: ${result.Location}`);

      // Elimina il file locale dopo il caricamento
      await unlink(filePath);
      return result.Location;
    } catch (error) {
      logger.error('Errore nel caricamento su S3:', error);
      throw error;
    }
  }

  async downloadBackup(filename) {
    try {
      const downloadParams = {
        Bucket: this.bucketName,
        Key: `backups/${filename}`
      };

      const filePath = join(process.cwd(), 'backups', filename);
      const fileStream = createWriteStream(filePath);

      return new Promise((resolve, reject) => {
        this.s3.getObject(downloadParams)
          .createReadStream()
          .pipe(fileStream)
          .on('error', reject)
          .on('close', () => {
            logger.info(`Backup scaricato da S3: ${filename}`);
            resolve(filePath);
          });
      });
    } catch (error) {
      logger.error('Errore nel download da S3:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: 'backups/'
      };

      const result = await this.s3.listObjectsV2(params).promise();
      return result.Contents.map(item => ({
        filename: item.Key.replace('backups/', ''),
        size: item.Size,
        createdAt: item.LastModified
      }));
    } catch (error) {
      logger.error('Errore nel listaggio backup su S3:', error);
      throw error;
    }
  }

  async deleteBackup(filename) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: `backups/${filename}`
      };

      await this.s3.deleteObject(params).promise();
      logger.info(`Backup eliminato da S3: ${filename}`);
    } catch (error) {
      logger.error('Errore nella cancellazione da S3:', error);
      throw error;
    }
  }
}

export default new CloudStorageService();