// config/cloud.js
export default {
  aws: {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET_NAME,
    backupPrefix: 'backups/',
    maxSize: 100 * 1024 * 1024, // 100MB
    expirationDays: 30
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    bucket: process.env.GCP_BUCKET_NAME,
    keyFilename: process.env.GCP_KEY_FILE
  },
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    container: process.env.AZURE_CONTAINER_NAME
  }
};