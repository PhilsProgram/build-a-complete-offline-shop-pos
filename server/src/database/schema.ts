import { db } from "./connection.js";

export function migrateDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EMPLOYEE')),
      password_hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      image_url TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      price REAL NOT NULL CHECK (price >= 0),
      cost_price REAL NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
      stock_quantity REAL NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
      units_per_pack INTEGER NOT NULL DEFAULT 1,
      allow_split_sales INTEGER NOT NULL DEFAULT 0,
      reorder_level INTEGER NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      employee_id INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      cost_total REAL NOT NULL DEFAULT 0,
      profit REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PAID'
      CHECK (
        payment_status IN (
          'PAID',
          'PARTIAL',
          'DEBT',
          'VOID'
        )
      ),
      cash_received REAL NOT NULL DEFAULT 0,
      change_due REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE SET NULL,
      FOREIGN KEY (employee_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price REAL NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      line_total REAL NOT NULL,
      sale_type TEXT NOT NULL DEFAULT 'PACK',
      profit REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE CASCADE,
      FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      method TEXT NOT NULL
      CHECK (
        method IN (
          'CASH',
          'CARD',
          'MOBILE_MONEY',
          'DEBT',
          'SPLIT'
        )
      ),
      amount REAL NOT NULL CHECK (amount >= 0),
      reference TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS debtors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      transaction_id INTEGER,
      amount_due REAL NOT NULL CHECK (amount_due >= 0),
      amount_paid REAL NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN'
      CHECK (
        status IN (
          'OPEN',
          'PARTIAL',
          'PAID',
          'OVERDUE'
        )
      ),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE,
      FOREIGN KEY (transaction_id)
        REFERENCES transactions(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount >= 0),
      payment_method TEXT NOT NULL DEFAULT 'CASH',
      recorded_by INTEGER NOT NULL,
      expense_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (recorded_by)
        REFERENCES users(id)
        ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS eod_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      business_date TEXT NOT NULL,
      cash_expected REAL NOT NULL DEFAULT 0,
      cash_counted REAL NOT NULL DEFAULT 0,
      card_expected REAL NOT NULL DEFAULT 0,
      card_counted REAL NOT NULL DEFAULT 0,
      mobile_expected REAL NOT NULL DEFAULT 0,
      mobile_counted REAL NOT NULL DEFAULT 0,
      expenses_total REAL NOT NULL DEFAULT 0,
      variance REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,
      UNIQUE (business_date)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id)
        REFERENCES products(id),
      FOREIGN KEY(user_id)
        REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_name
    ON products(name);

    CREATE INDEX IF NOT EXISTS idx_products_barcode
    ON products(barcode);

    CREATE INDEX IF NOT EXISTS idx_transactions_created_at
    ON transactions(created_at);

    CREATE INDEX IF NOT EXISTS idx_transactions_employee
    ON transactions(employee_id);

    CREATE INDEX IF NOT EXISTS idx_debtors_status
    ON debtors(status);

    CREATE INDEX IF NOT EXISTS idx_expenses_date
    ON expenses(expense_date);
  `);

  try {
    db.exec(`
      ALTER TABLE products
      ADD COLUMN is_favorite INTEGER DEFAULT 0;
    `);
  } catch {}
  try {
    db.exec(`
    ALTER TABLE products
    ADD COLUMN units_per_pack INTEGER NOT NULL DEFAULT 1
  `);
  } catch {}

  try {
    db.exec(`
    ALTER TABLE products
    ADD COLUMN allow_split_sales INTEGER NOT NULL DEFAULT 0
  `);
  } catch {}
  try {
  db.exec(`
    ALTER TABLE transaction_items
    ADD COLUMN sale_type TEXT NOT NULL DEFAULT 'PACK'
  `);
} catch {}
}

export function installUpdatedAtTriggers() {
  const tables = [
    "users",
    "categories",
    "products",
    "customers",
    "debtors",
    "expenses",
  ];

  for (const table of tables) {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS trg_${table}_updated_at
      AFTER UPDATE ON ${table}
      FOR EACH ROW
      WHEN OLD.updated_at = NEW.updated_at
      BEGIN
        UPDATE ${table}
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
      END;
    `);
  }

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
    AFTER UPDATE ON settings
    FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at
    BEGIN
      UPDATE settings
      SET updated_at = CURRENT_TIMESTAMP
      WHERE key = NEW.key;
    END;
  `);
}
