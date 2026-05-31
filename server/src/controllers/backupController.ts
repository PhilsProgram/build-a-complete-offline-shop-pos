import Database from 'better-sqlite3';
import multer from 'multer';
import fs from 'node:fs';
import { config } from '../config.js';
import { db, dbPath } from '../database/connection.js';
import { createDatabaseBackup, listDatabaseBackups } from '../services/backupService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

fs.mkdirSync(config.backupDir, { recursive: true });
fs.mkdirSync(config.uploadsDir, { recursive: true });

export const backupUpload = multer({
  dest: config.uploadsDir,
  limits: { fileSize: 1024 * 1024 * 250 }
});

export const listBackups = asyncHandler((_req, res) => {
  res.json({ backups: listDatabaseBackups() });
});

export const exportBackup = asyncHandler(async (req, res) => {
  const backup = await createDatabaseBackup('manual', req.user?.id);
  res.download(backup.path, backup.file);
});

export const restoreBackup = asyncHandler((req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'SQLite database file is required.' });
    return;
  }

  const tempPath = req.file.path;
  try {
    const candidate = new Database(tempPath, { readonly: true });
    candidate.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
    candidate.close();

    db.close();
    fs.copyFileSync(tempPath, dbPath);
    fs.rmSync(tempPath, { force: true });

    res.json({
      message: 'Database restored. Restart the local server before continuing to use the POS.'
    });
  } catch (error) {
    fs.rmSync(tempPath, { force: true });
    throw error;
  }
});
