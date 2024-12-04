// utils/cloudStorage.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

// Configurazione del provider cloud in base alle variabili d'ambiente
const cloudProvider = process.env.CLOUD_STORAGE_PROVIDER || 'aws'; // 'aws' o 'gcp'

// Configurazione AWS S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configurazione Google Cloud Storage
const gcpStorage = new Storage({
  keyFilename: process.env.GCP_KEY_FILE,
  projectId: process.env.GCP_PROJECT_ID
});

export const uploadToCloud = async (filePath) => {
  try {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    
    if (cloudProvider === 'aws') {
      // Upload su AWS S3
      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `backups/${fileName}`,
        Body: fileContent,
        ContentType: 'application/gzip'
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      
      logger.info(`File caricato su AWS S3: ${fileName}`);
      return `s3://${process.env.AWS_BUCKET_NAME}/backups/${fileName}`;
      
    } else if (cloudProvider === 'gcp') {
      // Upload su Google Cloud Storage
      const bucket = gcpStorage.bucket(process.env.GCP_BUCKET_NAME);
      const blob = bucket.file(`backups/${fileName}`);
      
      await blob.save(fileContent, {
        contentType: 'application/gzip',
        metadata: {
          cacheControl: 'no-cache'
        }
      });
      
      logger.info(`File caricato su Google Cloud Storage: ${fileName}`);
      return `gs://${process.env.GCP_BUCKET_NAME}/backups/${fileName}`;
    }

  } catch (error) {
    logger.error('Errore upload cloud:', error);
    throw new Error(`Errore upload su ${cloudProvider}: ${error.message}`);
  }
};

export const downloadFromCloud = async (fileName, localPath) => {
  try {
    if (cloudProvider === 'aws') {
      // Download da AWS S3
      const downloadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `backups/${fileName}`
      };

      const { Body } = await s3Client.send(
        new GetObjectCommand(downloadParams)
      );

      const writeStream = fs.createWriteStream(localPath);
      await pipeline(Body, writeStream);
      
      logger.info(`File scaricato da AWS S3: ${fileName}`);
      
    } else if (cloudProvider === 'gcp') {
      // Download da Google Cloud Storage
      const bucket = gcpStorage.bucket(process.env.GCP_BUCKET_NAME);
      const blob = bucket.file(`backups/${fileName}`);
      
      await blob.download({
        destination: localPath
      });
      
      logger.info(`File scaricato da Google Cloud Storage: ${fileName}`);
    }

    return localPath;
    
  } catch (error) {
    logger.error('Errore download cloud:', error);
    throw new Error(`Errore download da ${cloudProvider}: ${error.message}`);
  }
};

// Elimina file dal cloud storage
export const deleteFromCloud = async (fileName) => {
  try {
    if (cloudProvider === 'aws') {
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `backups/${fileName}`
      };

      await s3Client.send(new DeleteObjectCommand(deleteParams));
      logger.info(`File eliminato da AWS S3: ${fileName}`);
      
    } else if (cloudProvider === 'gcp') {
      const bucket = gcpStorage.bucket(process.env.GCP_BUCKET_NAME);
      await bucket.file(`backups/${fileName}`).delete();
      logger.info(`File eliminato da Google Cloud Storage: ${fileName}`);
    }
    
  } catch (error) {
    logger.error('Errore eliminazione cloud:', error);
    throw new Error(`Errore eliminazione da ${cloudProvider}: ${error.message}`);
  }
};

// Lista backup su cloud
export const listCloudBackups = async () => {
  try {
    if (cloudProvider === 'aws') {
      const listParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Prefix: 'backups/'
      };

      const { Contents } = await s3Client.send(
        new ListObjectsCommand(listParams)
      );
      
      return Contents.map(item => ({
        name: path.basename(item.Key),
        size: item.Size,
        lastModified: item.LastModified
      }));
      
    } else if (cloudProvider === 'gcp') {
      const [files] = await gcpStorage
        .bucket(process.env.GCP_BUCKET_NAME)
        .getFiles({ prefix: 'backups/' });
      
      return files.map(file => ({
        name: path.basename(file.name),
        size: file.metadata.size,
        lastModified: file.metadata.updated
      }));
    }
    
  } catch (error) {
    logger.error('Errore lista backup cloud:', error);
    throw new Error(`Errore lista backup da ${cloudProvider}: ${error.message}`);
  }
};