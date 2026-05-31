import { z } from 'zod';
import { db } from '../database/connection.js';
import { audit } from '../utils/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const settingsSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]));

function parseSettings(rows: Array<{ key: string; value: string }>) {
  return rows.reduce<Record<string, unknown>>((acc, row) => {
    try {
      acc[row.key] = JSON.parse(row.value);
    } catch {
      acc[row.key] = row.value;
    }
    return acc;
  }, {});
}

export const getSettings = asyncHandler((_req, res) => {
  const rows = db.prepare('SELECT key, value, updated_at as updatedAt FROM settings ORDER BY key ASC').all() as Array<{ key: string; value: string }>;
  res.json({ settings: parseSettings(rows) });
});

export const updateSettings = asyncHandler((req, res) => {
  const settings = settingsSchema.parse(req.body);
  const upsert = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (@key, @value)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  const write = db.transaction(() => {
    Object.entries(settings).forEach(([key, value]) => {
      upsert.run({ key, value: JSON.stringify(value) });
    });
  });

  write();
  audit(req.user?.id, 'UPDATE', 'settings', undefined, settings);
  res.json({ settings });
});
