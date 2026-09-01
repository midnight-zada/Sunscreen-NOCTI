import { SQLiteDatabase } from 'expo-sqlite'

export interface Application {
  id: string
  user_id: string
  user_sunscreen_id: number
  uvi_high: number | null
  uvi_low: number | null
  uvi_average: number | null
  is_water_exposed: number
  latitude: number | null
  longitude: number | null
  applied_at: string
  created_at: string
  synced_at: string | null
}

export type InsertApplication = Omit<Application, 'id' | 'created_at' | 'synced_at'>

export async function getApplications(db: SQLiteDatabase, userId: string) {
  return db.getAllAsync<Application>(
    /* sql */ `
    SELECT * FROM sunscreen_logs WHERE user_id = ? ORDER BY applied_at DESC`,
    userId
  )
}

export async function insertApplication(
  db: SQLiteDatabase,
  application: InsertApplication
) {
  const now = new Date().toISOString()

  const result = await db.runAsync(
    /* sql */ `
    INSERT INTO sunscreen_logs
      (user_id, user_sunscreen_id, uvi_high, uvi_low, uvi_average, is_water_exposed, 
      latitude, longitude, applied_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    application.user_id,
    application.user_sunscreen_id,
    application.uvi_high,
    application.uvi_low,
    application.uvi_average,
    application.is_water_exposed,
    application.latitude,
    application.longitude,
    application.applied_at,
    now
  )

  return result.lastInsertRowId
}
