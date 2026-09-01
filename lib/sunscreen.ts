import { SQLiteDatabase } from 'expo-sqlite'

export interface Sunscreen {
  id: number
  name: string
  brand: string | null
  spf: number
  type: string | null
  form: string | null
  coverage: string | null
  duration: number
  water_duration: number | null
  image_uri: string | null
  barcode: string | null
  created_at: string
  updated_at: string
}

// Sunscreen Functions
export async function getSunscreens(db: SQLiteDatabase): Promise<Sunscreen[]> {
  return db.getAllAsync<Sunscreen>(/* sql */ `
    SELECT * FROM sunscreen
  `)
}
