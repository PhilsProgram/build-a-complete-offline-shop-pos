import { dbPath } from './connection.js';
import { installUpdatedAtTriggers, migrateDatabase } from './schema.js';
import { seedDatabase } from './seed.js';

migrateDatabase();
installUpdatedAtTriggers();
seedDatabase();

console.log(`SQLite database ready at ${dbPath}`);
