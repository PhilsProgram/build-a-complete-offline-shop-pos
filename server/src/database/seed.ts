import bcrypt from 'bcryptjs';
import { db } from './connection.js';

const defaultSettings: Record<string, unknown> = {
  shopName: 'Offline Shop POS',
  shopPhone: '',
  shopAddress: '',
  currency: 'GHS',
  receiptFooter: 'Thank you for shopping with us.',
  taxRate: 0,
  lowStockThreshold: 5
};

export function seedDatabase() {
  const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get() as { count: number };

  if (adminCount.count === 0) {
    const hash = bcrypt.hashSync('Admin@1234', 12);
    db.prepare(`
      INSERT INTO users (name, username, role, password_hash, active)
      VALUES (@name, @username, 'ADMIN', @passwordHash, 1)
    `).run({
      name: 'System Admin',
      username: 'admin',
      passwordHash: hash
    });
  }

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    ['General', 'Groceries', 'Drinks', 'Household'].forEach((name) => {
      insertCategory.run(name, `${name} products`);
    });
  }

  const insertSetting = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (@key, @value)
    ON CONFLICT(key) DO NOTHING
  `);

  Object.entries(defaultSettings).forEach(([key, value]) => {
    insertSetting.run({ key, value: JSON.stringify(value) });
  });
}
