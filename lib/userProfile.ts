import { Directory, File, Paths } from 'expo-file-system'
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker'
import { SQLiteDatabase } from 'expo-sqlite'

export interface UserProfile {
  user_id: string
  display_name: string | null
  bio: string | null
  skin_type: string | null
  profile_image_uri: string | null
  created_at: string
  updated_at: string
  synced_at: string | null
}

export type InsertUserProfile = Omit<
  UserProfile,
  'created_at' | 'updated_at' | 'synced_at'
>

export async function getUserProfile(
  db: SQLiteDatabase,
  userId: string
): Promise<UserProfile | null> {
  const row = await db.getFirstAsync<UserProfile>(
    /* sql */ `
    SELECT * FROM user_profile WHERE user_id = ?`,
    userId
  )

  return row
}

export async function insertUserProfile(
  db: SQLiteDatabase,
  data: InsertUserProfile
): Promise<number> {
  const now = new Date().toISOString()

  const result = await db.runAsync(
    /* sql */ `
    INSERT INTO user_profile
      (user_id, display_name, bio, skin_type, profile_image_uri, 
      created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    data.user_id,
    data.display_name ?? null,
    data.bio ?? null,
    data.skin_type ?? null,
    data.profile_image_uri ?? null,
    now,
    now
  )

  return result.lastInsertRowId
}

export async function updateUserProfile(
  db: SQLiteDatabase,
  userId: string,
  data: Partial<InsertUserProfile>
): Promise<void> {
  const now = new Date().toISOString()

  await db.runAsync(
    /* sql */ `
    UPDATE user_profile
    SET display_name = COALESCE(?, display_name),
        bio = COALESCE(?, bio),
        skin_type = COALESCE(?, skin_type),
        profile_image_uri = COALESCE(?, profile_image_uri),
        updated_at = ?
    WHERE user_id = ?`,
    data.display_name ?? null,
    data.bio ?? null,
    data.skin_type ?? null,
    data.profile_image_uri ?? null,
    now,
    userId
  )
}

function saveProfileImage(uri: string, userId: string): string {
  const dir = new Directory(Paths.document, 'images/user_profile')
  if (!dir.exists) dir.create({ intermediates: true })

  const dest = new File(dir, `${userId}.jpg`)
  if (dest.exists) dest.delete()

  const source = new File(uri)
  source.copy(dest)

  return `${dest.uri}?v=${Date.now()}`
}

export async function pickProfileImage(userId: string): Promise<string | null> {
  const { status } = await requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') return null

  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
  })

  if (result.canceled) return null

  return saveProfileImage(result.assets[0].uri, userId)
}
