import { SQLiteDatabase } from 'expo-sqlite'

export interface UserSunscreen {
  id: number
  user_id: string
  sunscreen_id: number | null

  // user-only fields
  nickname: string | null
  is_favorite: number
  notes: string | null
  image_uri: string | null
  is_archived: number

  // copied/edited from catalog at insert time
  name: string | null
  brand: string | null
  spf: number
  type: string | null
  form: string | null
  coverage: string | null
  duration: number
  water_duration: number | null
  barcode: string | null

  created_at: string
  updated_at: string
  synced_at: string | null
}

export type InsertUserSunscreen = Omit<
  UserSunscreen,
  'id' | 'is_archived' | 'created_at' | 'updated_at' | 'synced_at'
>
export type EditUserSunscreen = Omit<
  UserSunscreen,
  'id' | 'user_id' | 'is_archived' | 'created_at' | 'synced_at'
>

// User Sunscreen Functions
export async function getUserSunscreens(db: SQLiteDatabase): Promise<UserSunscreen[]> {
  return db.getAllAsync<UserSunscreen>(/* sql */ `
    SELECT * FROM user_sunscreen
  `)
}

export async function getActiveUserSunscreens(
  db: SQLiteDatabase
): Promise<UserSunscreen[]> {
  return db.getAllAsync<UserSunscreen>(/* sql */ `
    SELECT * FROM user_sunscreen
    WHERE is_archived = 0
  `)
}

export async function insertUserSunscreen(
  db: SQLiteDatabase,
  data: InsertUserSunscreen
): Promise<number> {
  const now = new Date().toISOString()

  const result = await db.runAsync(
    /* sql */ `
    INSERT INTO user_sunscreen 
      (user_id, sunscreen_id, nickname, is_favorite, notes, image_uri, 
      name, brand, spf, type, form, coverage, duration, water_duration, 
      barcode, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    data.user_id,
    data.sunscreen_id ?? null,
    data.nickname ?? null,
    data.is_favorite ?? 0,
    data.notes ?? null,
    data.image_uri ?? null,
    data.name,
    data.brand ?? null,
    data.spf,
    data.type ?? null,
    data.form ?? null,
    data.coverage ?? null,
    data.duration,
    data.water_duration ?? null,
    data.barcode ?? null,
    now,
    now
  )

  return result.lastInsertRowId
}

export async function editUserSunscreen(
  db: SQLiteDatabase,
  data: UserSunscreen
): Promise<number> {
  const now = new Date().toISOString()

  const result = await db.runAsync(
    /* sql */ `
    UPDATE user_sunscreen SET
      sunscreen_id = ?, nickname = ?, is_favorite = ?, notes = ?,
      image_uri = ?, name = ?, brand = ?, spf = ?, type = ?, form = ?,
      coverage = ?, duration = ?, water_duration = ?, barcode = ?, updated_at = ?
    WHERE id = ?`,
    data.sunscreen_id ?? null,
    data.nickname ?? null,
    data.is_favorite,
    data.notes ?? null,
    data.image_uri ?? null,
    data.name,
    data.brand ?? null,
    data.spf,
    data.type ?? null,
    data.form ?? null,
    data.coverage ?? null,
    data.duration,
    data.water_duration ?? null,
    data.barcode ?? null,
    now,
    data.id
  )

  return result.changes
}

export async function setUserSunscreenFavorite(
  db: SQLiteDatabase,
  id: number,
  isFavorite: 0 | 1
): Promise<number> {
  const result = await db.runAsync(
    /* sql */ `UPDATE  user_sunscreen SET is_favorite = ? WHERE id = ?`,
    isFavorite,
    id
  )

  return result.changes
}

export async function setUserSunscreenArchive(
  db: SQLiteDatabase,
  id: number,
  isArchive: 0 | 1
): Promise<number> {
  const result = await db.runAsync(
    /* sql */ `UPDATE user_sunscreen SET is_archived = ? WHERE id = ?`,
    isArchive,
    id
  )

  return result.changes
}
