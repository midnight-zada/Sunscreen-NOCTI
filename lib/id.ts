import { randomUUID } from 'expo-crypto'
import { SQLiteDatabase } from 'expo-sqlite'

let cachedUserId: string | null = null

export async function getUserId(db: SQLiteDatabase): Promise<string> {
  if (cachedUserId) return cachedUserId

  const entry = await db.getFirstAsync<{ value: string }>(
    /* sql */ `SELECT value FROM device_metadata WHERE key = 'user_id'`
  )

  if (entry) {
    cachedUserId = entry.value
    return entry.value
  }

  const newUserId = randomUUID()
  await db.runAsync(
    /* sql */ `
    INSERT INTO device_metadata (key, value) VALUES ('user_id', ?)`,
    newUserId
  )

  cachedUserId = newUserId
  return newUserId
}
