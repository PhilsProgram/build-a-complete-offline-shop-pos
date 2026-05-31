import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { db } from '../database/connection.js';
import { audit } from '../utils/audit.js';

export type BackupKind = 'manual' | 'auto';

export interface BackupInfo {
  file: string;
  kind: BackupKind | 'unknown';
  size: number;
  createdAt: string;
}

fs.mkdirSync(config.backupDir, { recursive: true });

function timestampForFilename(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + '-' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('-');
}

function backupKindFromFile(file: string): BackupInfo['kind'] {
  if (file.startsWith('auto-pos-backup-')) return 'auto';
  if (file.startsWith('pos-backup-')) return 'manual';
  return 'unknown';
}

export function listDatabaseBackups(): BackupInfo[] {
  return fs.readdirSync(config.backupDir)
    .filter((file) => file.endsWith('.db'))
    .map((file) => {
      const fullPath = path.join(config.backupDir, file);
      const stat = fs.statSync(fullPath);
      return {
        file,
        kind: backupKindFromFile(file),
        size: stat.size,
        createdAt: stat.birthtime.toISOString()
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function hasAutoBackupForDate(date: Date) {
  const datePrefix = timestampForFilename(date).slice(0, 10);
  return listDatabaseBackups().some((backup) => backup.file.startsWith(`auto-pos-backup-${datePrefix}`));
}

export async function createDatabaseBackup(kind: BackupKind, userId?: number) {
  fs.mkdirSync(config.backupDir, { recursive: true });
  db.pragma('wal_checkpoint(TRUNCATE)');

  const filename = `${kind === 'auto' ? 'auto-pos-backup' : 'pos-backup'}-${timestampForFilename()}.db`;
  const target = path.join(config.backupDir, filename);

  await db.backup(target);
  audit(userId, kind === 'auto' ? 'AUTO_EXPORT' : 'EXPORT', 'backups', filename);

  return {
    file: filename,
    path: target
  };
}

export function pruneAutoBackups(retentionDays: number) {
  if (retentionDays <= 0) return;

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  for (const backup of listDatabaseBackups()) {
    if (backup.kind !== 'auto') continue;

    const fullPath = path.join(config.backupDir, backup.file);
    const stat = fs.statSync(fullPath);

    if (stat.mtime.getTime() < cutoff) {
      fs.rmSync(fullPath, { force: true });
      audit(undefined, 'PRUNE', 'backups', backup.file, { retentionDays });
    }
  }
}
