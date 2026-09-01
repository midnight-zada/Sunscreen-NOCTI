import * as SQLite from 'expo-sqlite'
import { SQLiteDatabase } from 'expo-sqlite'

export async function openDB() {
  const db = await SQLite.openDatabaseAsync('app.db')
  await db.execAsync(`PRAGMA journal_mode = WAL;`)
  await db.execAsync(`PRAGMA foreign_keys = ON;`)
  await runMigrations(db)
  return db
}

async function runMigrations(db: SQLite.SQLiteDatabase) {
  await db.execAsync(/* sql */ `
    CREATE TABLE IF NOT EXISTS device_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sunscreen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT NOT NULL,
      brand TEXT,
      spf INTEGER NOT NULL,
      type TEXT,                        -- 'lotion' | 'spray' | 'stick' | 'gel'
      form TEXT,                        --
      coverage TEXT,                    -- 
      duration INTEGER NOT NULL,        -- ms, normal reapply duration
      water_duration INTEGER,           -- ms, null = not water resistant / no claim
      image_uri TEXT,                   -- stock catalog image
      barcode TEXT,
      
      -- ISO 8601 string
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sunscreen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      sunscreen_id INTEGER,             -- FK to sunscreen.id, null if custom entry

      -- user-only fields
      nickname TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      image_uri TEXT,                   -- user's own photo/library pick only
      is_archived INTEGER NOT NULL DEFAULT 0,

      -- copied from sunscreen at save time
      name TEXT NOT NULL,
      brand TEXT,
      spf INTEGER NOT NULL,
      type TEXT,
      form TEXT,
      coverage TEXT,
      duration INTEGER NOT NULL,
      water_duration INTEGER,
      barcode TEXT,

      -- ISO 8601 string
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,

      FOREIGN KEY (sunscreen_id) REFERENCES sunscreen(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS application (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_sunscreen_id INTEGER NOT NULL,
      
      uvi_high INTEGER,
      uvi_low INTEGER,
      uvi_average INTEGER,
      is_water_exposed INTEGER NOT NULL DEFAULT 0,
      latitude REAL,
      longitude REAL,
      
      -- ISO 8601 string
      applied_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced_at TEXT,

      FOREIGN KEY (user_sunscreen_id) REFERENCES user_sunscreen(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS uv_reading (
      id TEXT PRIMARY KEY,

      timestamp TEXT NOT NULL,          -- ISO 8601
      uvi REAL NOT NULL,
      latitude REAL,
      longitude REAL
    );

    CREATE INDEX IF NOT EXISTS user_current_sunscreen
      ON user_sunscreen(user_id, is_archived);

    CREATE INDEX IF NOT EXISTS user_application
      ON application(user_id, applied_at);
  `)
}

export async function dropTable(db: SQLiteDatabase, table: string): Promise<void> {
  await db.execAsync(/* sql */ `DROP TABLE IF EXISTS ${table}`)
}
