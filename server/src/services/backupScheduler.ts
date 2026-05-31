import { config } from '../config.js';
import { createDatabaseBackup, hasAutoBackupForDate, pruneAutoBackups } from './backupService.js';

const ONE_MINUTE = 60 * 1000;

function parseScheduleTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    return { hours: 23, minutes: 59 };
  }

  return {
    hours: Number(match[1]),
    minutes: Number(match[2])
  };
}

function shouldBackupNow(now: Date) {
  const scheduled = parseScheduleTime(config.autoBackupTime);
  return now.getHours() > scheduled.hours ||
    (now.getHours() === scheduled.hours && now.getMinutes() >= scheduled.minutes);
}

export function startBackupScheduler() {
  if (!config.autoBackupEnabled) {
    console.log('Automatic SQLite backups are disabled.');
    return;
  }

  let running = false;

  async function runIfDue() {
    if (running) return;

    const now = new Date();
    if (!shouldBackupNow(now) || hasAutoBackupForDate(now)) return;

    running = true;
    try {
      const backup = await createDatabaseBackup('auto');
      pruneAutoBackups(config.autoBackupRetentionDays);
      console.log(`Automatic SQLite backup saved: ${backup.file}`);
    } catch (error) {
      console.error('Automatic SQLite backup failed.', error);
    } finally {
      running = false;
    }
  }

  console.log(
    `Automatic SQLite backups enabled at ${config.autoBackupTime} daily; folder: ${config.backupDir}`
  );

  void runIfDue();
  setInterval(() => {
    void runIfDue();
  }, ONE_MINUTE);
}
