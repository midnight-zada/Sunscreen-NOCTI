import { Directory, File, Paths } from 'expo-file-system'
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker'
import { SQLiteDatabase } from 'expo-sqlite'
import { getBorderColor } from './imageColor'

export interface UserProfile {
  user_id: string
  display_name: string | null
  bio: string | null
  skin_type: string | null
  profile_image_uri: string | null
  image_border_color: string | null
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
      image_border_color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    data.user_id,
    data.display_name ?? null,
    data.bio ?? null,
    data.skin_type ?? null,
    data.profile_image_uri ?? null,
    data.image_border_color ?? null,
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
    INSERT INTO user_profile
      (user_id, display_name, bio, skin_type, profile_image_uri,
      image_border_color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      display_name = COALESCE(excluded.display_name, display_name),
      bio = COALESCE(excluded.bio, bio),
      skin_type = COALESCE(excluded.skin_type, skin_type),
      profile_image_uri = COALESCE(excluded.profile_image_uri, profile_image_uri),
      image_border_color = COALESCE(excluded.image_border_color, image_border_color),
      updated_at = excluded.updated_at`,
    userId,
    data.display_name ?? null,
    data.bio ?? null,
    data.skin_type ?? null,
    data.profile_image_uri ?? null,
    data.image_border_color ?? null,
    now,
    now
  )
}

export async function setBorderColor(
  db: SQLiteDatabase,
  userId: string,
  color: string | null
) {
  const now = new Date().toISOString()

  await db.runAsync(
    /* sql */ `
    UPDATE user_profile
    SET image_border_color = ?, updated_at = ?
    WHERE user_id = ?`,
    color,
    now,
    userId
  )
}

export async function setProfileImage(
  db: SQLiteDatabase,
  userId: string,
  uri: string | null,
  color: string | null
) {
  const now = new Date().toISOString()

  await db.runAsync(
    /* sql */ `
    INSERT INTO user_profile
      (user_id, profile_image_uri, image_border_color, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      profile_image_uri = excluded.profile_image_uri,
      image_border_color = excluded.image_border_color,
      updated_at = excluded.updated_at`,
    userId,
    uri,
    color,
    now,
    now
  )
}

async function saveProfileImage(
  uri: string,
  userId: string
): Promise<[string, string | null] | null> {
  const dir = new Directory(Paths.document, 'images/user_profile')
  if (!dir.exists) dir.create({ intermediates: true })

  const dest = new File(dir, `${userId}.jpg`)
  if (dest.exists) dest.delete()

  const source = new File(uri)
  source.copy(dest)

  const borderColor = await getBorderColor(uri)

  return [`${dest.uri}?v=${Date.now()}`, borderColor]
}

export async function pickProfileImage(
  userId: string
): Promise<[string, string | null] | null> {
  const { status } = await requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') return null

  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
  })

  if (result.canceled) return null

  return await saveProfileImage(result.assets[0].uri, userId)
}

export async function takeProfilePhoto(
  userId: string
): Promise<[string, string | null] | null> {
  const { status } = await requestCameraPermissionsAsync()
  if (status !== 'granted') return null

  const result = await launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
  })

  if (result.canceled) return null

  return await saveProfileImage(result.assets[0].uri, userId)
}
