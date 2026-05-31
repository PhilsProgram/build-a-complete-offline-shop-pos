import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const serverRoot = process.cwd();

/*
  STORAGE ROOT
  Keeps business data outside the app folders
*/
const storageRoot = path.resolve(serverRoot, '../storage');

export const config = {
  host: process.env.HOST ?? '0.0.0.0',

  port: Number(process.env.PORT ?? 4000),

  httpsEnabled: process.env.HTTPS_ENABLED === 'true',

  httpsKeyPath: path.resolve(
    serverRoot,
    process.env.HTTPS_KEY_PATH ?? './certs/pos-key.pem'
  ),

  httpsCertPath: path.resolve(
    serverRoot,
    process.env.HTTPS_CERT_PATH ?? './certs/pos-cert.pem'
  ),

  jwtSecret:
    process.env.JWT_SECRET ?? 'change-this-local-pos-secret',

  jwtExpiresIn:
    process.env.JWT_EXPIRES_IN ?? '12h',

  corsOrigin:
    process.env.CORS_ORIGIN ?? '*',

  /*
    SQLITE DATABASE
  */
  dbPath: path.resolve(
    storageRoot,
    'database',
    'pos.db'
  ),

  /*
    BACKUPS
  */
  backupDir: path.resolve(
    storageRoot,
    'backups'
  ),

  autoBackupEnabled:
    process.env.AUTO_BACKUP_ENABLED !== 'false',

  autoBackupTime:
    process.env.AUTO_BACKUP_TIME ?? '23:59',

  autoBackupRetentionDays:
    Number(process.env.AUTO_BACKUP_RETENTION_DAYS ?? 30),

  /*
    FILE UPLOADS
  */
  uploadsDir: path.resolve(
    storageRoot,
    'uploads'
  ),

  /*
    FRONTEND BUILD
  */
  frontendDist: path.resolve(
    serverRoot,
    '../frontend/dist'
  )
};