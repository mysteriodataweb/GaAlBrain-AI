import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'gaalabrain.db');
const dbDir = path.dirname(dbPath);

// Créer le répertoire s'il n'existe pas
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let sqlDb: SqlJsDatabase;
let SQL: any;

// Classe wrapper pour une API compatible
class Database {
  private db: SqlJsDatabase;

  constructor(database: SqlJsDatabase) {
    this.db = database;
  }

  prepare(sql: string) {
    const db = this.db;
    return {
      run: (...params: any[]) => {
        try {
          db.run(sql, params);
          this.save();
          return { lastID: null, changes: db.getRowsModified() };
        } catch (error) {
          throw error;
        }
      },
      get: (...params: any[]) => {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        } catch (error) {
          throw error;
        }
      },
      all: (...params: any[]) => {
        try {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const rows: any[] = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return rows;
        } catch (error) {
          throw error;
        }
      },
    };
  }

  exec(sql: string): void {
    try {
      // sql.js exec() prend un tableau de statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          this.db.run(stmt);
        }
      }
      this.save();
    } catch (error) {
      console.error('Erreur exec:', error);
      throw error;
    }
  }

  private save() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (error) {
      console.error('Erreur sauvegarde BD:', error);
    }
  }
}

async function initializeDatabase(): Promise<Database> {
  SQL = await initSqlJs();

  // Charger la BD existante ou créer nouvelle
  let data: Uint8Array | undefined;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    data = new Uint8Array(buffer);
  }

  sqlDb = new SQL.Database(data);
  sqlDb.run('PRAGMA foreign_keys = ON');

  console.log('✅ Connecté à SQLite (sql.js):', dbPath);

  return new Database(sqlDb);
}

let dbInstance: Database;
let initPromise: Promise<void>;

export async function initDatabase() {
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    try {
      dbInstance = await initializeDatabase();
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      dbInstance.exec(schema);
      console.log('✅ Base de données initialisée');
    } catch (error) {
      console.error('❌ Erreur initialisation BD:', error);
      throw error;
    }
  })();

  await initPromise;
}

// Retourner un proxy qui attend initDatabase
const handler = {
  get: (target: Database, prop: string) => {
    if (!dbInstance) {
      throw new Error('Database not initialized. Call initDatabase() first');
    }
    return (dbInstance as any)[prop];
  },
};

export default new Proxy({} as Database, handler);
