import cron from 'node-cron';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import nodemailer from 'nodemailer';
import { createBackup, getBackupInfo } from './backupService.js';
import { generateBackupReport } from './reportGenerator.js';
import logger from '../config/logger.js';

class BackupScheduler {
  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    this.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.schedules = new Map();
  }

  async scheduleBackup(schedule, options = {}) {
    const jobId = `backup-${Date.now()}`;
    
    const job = cron.schedule(schedule, async () => {
      try {
        logger.info(`Starting scheduled backup: ${jobId}`);
        
        // Crea backup
        const backup = await createBackup(options);
        
        // Upload su S3
        if (options.uploadToS3) {
          await this.uploadToS3(backup.filename);
        }

        // Genera report
        if (options.generateReport) {
          const report = await generateBackupReport(backup);
          
          // Invia email con report
          if (options.emailNotification) {
            await this.sendEmailNotification({
              to: options.notificationEmail,
              subject: 'Backup Report',
              backup,
              report
            });
          }
        }

        logger.info(`Scheduled backup completed: ${jobId}`);
      } catch (error) {
        logger.error(`Scheduled backup failed: ${jobId}`, error);
        
        if (options.emailNotification) {
          await this.sendEmailNotification({
            to: options.notificationEmail,
            subject: 'Backup Failed',
            error: error.message
          });
        }
      }
    });

    this.schedules.set(jobId, { job, options });
    return jobId;
  }

  async uploadToS3(filename) {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `backups/${filename}`,
      Body: await getBackupInfo(filename)
    });
    
    await this.s3Client.send(command);
  }

  async sendEmailNotification({ to, subject, backup, report, error }) {
    const html = error 
      ? this.getErrorEmailTemplate(error)
      : this.getSuccessEmailTemplate(backup, report);

    await this.mailer.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });
  }

  getSuccessEmailTemplate(backup, report) {
    return `
      <h2>Backup Completato</h2>
      <p>Il backup è stato completato con successo.</p>
      <h3>Dettagli:</h3>
      <ul>
        <li>Nome file: ${backup.filename}</li>
        <li>Dimensione: ${backup.size}</li>
        <li>Data: ${new Date(backup.createdAt).toLocaleString()}</li>
      </ul>
      ${report ? `<h3>Report:</h3>${report}` : ''}
    `;
  }

  getErrorEmailTemplate(error) {
    return `
      <h2>Errore Backup</h2>
      <p>Si è verificato un errore durante il backup:</p>
      <pre>${error}</pre>
    `;
  }

  stopSchedule(jobId) {
    const schedule = this.schedules.get(jobId);
    if (schedule) {
      schedule.job.stop();
      this.schedules.delete(jobId);
      logger.info(`Backup schedule stopped: ${jobId}`);
      return true;
    }
    return false;
  }

  getSchedules() {
    return Array.from(this.schedules.entries()).map(([id, { options }]) => ({
      id,
      ...options
    }));
  }
}

export const backupScheduler = new BackupScheduler();