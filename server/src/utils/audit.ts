import { db } from '../database/connection.js';

export function audit(userId: number | undefined, action: string, entity: string, entityId?: string | number, details?: unknown) {
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
    VALUES (@userId, @action, @entity, @entityId, @details)
  `).run({
    userId: userId ?? null,
    action,
    entity,
    entityId: entityId === undefined ? null : String(entityId),
    details: details === undefined ? null : JSON.stringify(details)
  });
}
