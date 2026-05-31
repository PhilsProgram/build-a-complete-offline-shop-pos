import fs from 'node:fs';
import https from 'node:https';
import { createApp } from './app.js';
import { config } from './config.js';
import { dbPath } from './database/connection.js';
import { installUpdatedAtTriggers, migrateDatabase } from './database/schema.js';
import { seedDatabase } from './database/seed.js';
import { startBackupScheduler } from './services/backupScheduler.js';
import path from "path";
import uploadRoutes from "./routes/uploadRoutes.js";
import express from "express";
fs.mkdirSync(config.backupDir, { recursive: true });
fs.mkdirSync(config.uploadsDir, { recursive: true });

migrateDatabase();
installUpdatedAtTriggers();
seedDatabase();
startBackupScheduler();

const app = createApp();



if (config.httpsEnabled) {
  const key = fs.readFileSync(config.httpsKeyPath);
  const cert = fs.readFileSync(config.httpsCertPath);
  https.createServer({ key, cert }, app).listen(config.port, config.host, () => {
    console.log(`POS server listening on https://${config.host}:${config.port}`);
    console.log(`SQLite database: ${dbPath}`);
    console.log('Use a trusted local certificate for PWA install support on LAN devices.');
  });
} else {
  app.listen(config.port, config.host, () => {
    console.log(`POS server listening on http://${config.host}:${config.port}`);
    console.log(`SQLite database: ${dbPath}`);
    console.log('Use the admin PC LAN IPv4 address from other devices on the same router/WiFi.');
  });
}

