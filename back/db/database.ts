import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";


// Funciones para conectar y desconectar de la base de datos.
// El objeto db es lo que usaremos en nuestro código.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let db: Database.Database;

export const connect = async (dbPath: string) => {
    const resolvedPath = path.resolve(__dirname, dbPath);
    
    db = new Database(resolvedPath, { verbose: console.log });
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');

    // Initialize tables
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('✓ Database connected and initialized');
};

export const disconnect = async () => {
    if (db) {
        db.close();
        console.log('✓ Database disconnected');
    }
};

// Graceful shutdown handlers
process.on('exit', () => {
    if (db) db.close();
});

process.on('SIGINT', () => {
    disconnect().then(() => process.exit(128 + 2));
});

process.on('SIGTERM', () => {
    disconnect().then(() => process.exit(128 + 15));
});
