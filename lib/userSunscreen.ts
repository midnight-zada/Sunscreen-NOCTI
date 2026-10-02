import { Directory, File, Paths } from 'expo-file-system'
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker'
import { SQLiteDatabase } from 'expo-sqlite'
import { getBorderColor } from './imageColor'

export const TYPE_OPTIONS = [
  { label: 'None', value: null },
  { label: 'Chemical', value: 'chemical' },
  { label: 'Mineral', value: 'mineral' },
  { label: 'Hybrid', value: 'hybrid' },
]

export const FORM_OPTIONS = [
  { label: 'None', value: null },
  { label: 'Lotion', value: 'lotion' },
  { label: 'Gel', value: 'gel' },
  { label: 'Spray', value: 'spray' },
  { label: 'Stick', value: 'stick' },
  { label: 'Cream', value: 'cream' },
]

export const COVERAGE_OPTIONS = [
  { label: 'None', value: null },
  { label: 'Face', value: 'face' },
  { label: 'Body', value: 'body' },
  { label: 'Lip', value: 'lip' },
]

export const SORT_OPTIONS = [
  { label: 'Created At', value: 'created' },
  { label: 'Updated At', value: 'updated' },
  { label: 'Nickname', value: 'alpha_nickname' },
  { label: 'Name', value: 'alpha_name' },
  { label: 'Brand', value: 'alpha_brand'},
  { label: 'SPF', value: 'spf' },
  { label: 'Duration', value: 'duration' },
  { label: 'Water Resistance', value: 'water_duration' },
] as const

export type SortOptions = (typeof SORT_OPTIONS)[number]['value']

export type ImageType = 'cover' | 'product'

export interface UserSunscreen {
  id: number
  user_id: string
  sunscreen_id: number | null

  // user-only fields
  nickname: string | null
  is_favorite: number
  notes: string | null
  cover_uri: string | null
  cover_border_color: string | null
  image_uri: string | null
  border_color: string | null
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

function compareNullableString(
  a: string | null,
  b: string | null,
  direction: 'asc' | 'desc' = 'asc'
): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
}

function compareNullableNumber(
  a: number | null,
  b: number | null,
  direction: 'asc' | 'desc' = 'asc'
): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return direction === 'asc' ? a - b : b - a
}

export type SortDirection = 'asc' | 'desc'

export function sortUserSunscreens(
  list: UserSunscreen[],
  sortOption: SortOptions,
  direction: SortDirection = 'asc'
): UserSunscreen[] {
  const sorted = [...list]

  switch (sortOption) {
    case 'created':
      return sorted.sort((a, b) => (direction === 'asc' ? a.id - b.id : b.id - a.id))
    case 'updated':
      return sorted.sort((a, b) =>
        direction === 'asc'
          ? a.updated_at.localeCompare(b.updated_at)
          : b.updated_at.localeCompare(a.updated_at)
      )
    case 'alpha_nickname':
      return sorted.sort((a, b) => compareNullableString(a.nickname, b.nickname, direction))
    case 'alpha_name':
      return sorted.sort((a, b) => compareNullableString(a.name, b.name, direction))
    case 'alpha_brand':
      return sorted.sort((a, b) => compareNullableString(a.brand, b.brand, direction))
    case 'spf':
      return sorted.sort((a, b) => (direction === 'asc' ? a.spf - b.spf : b.spf - a.spf))
    case 'duration':
      return sorted.sort((a, b) =>
        direction === 'asc' ? a.duration - b.duration : b.duration - a.duration
      )
    case 'water_duration':
      return sorted.sort((a, b) =>
        compareNullableNumber(a.water_duration, b.water_duration, direction)
      )
    default:
      return sorted
  }
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
      (user_id, sunscreen_id, nickname, is_favorite, notes, cover_uri, 
      cover_border_color, image_uri, border_color, name, brand, spf, type, form, 
      coverage, duration, water_duration, barcode, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    data.user_id,
    data.sunscreen_id ?? null,
    data.nickname ?? null,
    data.is_favorite ?? 0,
    data.notes ?? null,
    data.cover_uri ?? null,
    data.cover_border_color ?? null,
    data.image_uri ?? null,
    data.border_color ?? null,
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
  id: number,
  data: InsertUserSunscreen
): Promise<void> {
  const now = new Date().toISOString()

  const result = await db.runAsync(
    /* sql */ `
    UPDATE user_sunscreen SET
      sunscreen_id = ?, nickname = ?, is_favorite = ?, notes = ?, cover_uri = ?, 
      cover_border_color = ?, image_uri = ?, border_color = ?, name = ?, brand = ?, 
      spf = ?, type = ?, form = ?, coverage = ?, duration = ?, water_duration = ?, 
      barcode = ?, updated_at = ?
    WHERE id = ?`,
    data.sunscreen_id ?? null,
    data.nickname ?? null,
    data.is_favorite,
    data.notes ?? null,
    data.cover_uri ?? null,
    data.cover_border_color ?? null,
    data.image_uri ?? null,
    data.border_color ?? null,
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
    id
  )

  if (result.changes === 0) throw new Error(`No user_sunscreen found with id ${id}`)
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

  if (result.changes === 0) throw new Error(`No user_sunscreen found with id ${id}`)

  return result.changes
}

export async function setUserSunscreenArchive(
  db: SQLiteDatabase,
  id: number,
  isArchive: 0 | 1
): Promise<void> {
  const result = await db.runAsync(
    /* sql */ `UPDATE user_sunscreen SET is_archived = ? WHERE id = ?`,
    isArchive,
    id
  )

  if (result.changes === 0) throw new Error(`No user_sunscreen found with id ${id}`)
}

export function formatDuration(durationMs: number): string {
  const totalMinutes = Math.round(durationMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) return `${minutes} Min`
  if (minutes === 0) return `${hours} Hr`
  return `${hours} Hr ${minutes} Min`
}

async function stageUserSunscreenImage(
  uri: string,
  type: ImageType
): Promise<[string, string | null] | null> {
  const dir = new Directory(Paths.document, 'images/user_sunscreen/staged')
  if (!dir.exists) dir.create({ intermediates: true })

  const dest = new File(dir, `${type}_${Date.now()}.jpg`)

  const source = new File(uri)
  source.copy(dest)

  const borderColor = await getBorderColor(uri)

  return [dest.uri, borderColor]
}

export async function pickUserSunscreenImage(
  type: ImageType
): Promise<[string, string | null] | null> {
  const { status } = await requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') return null

  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
  })

  if (result.canceled) return null

  return await stageUserSunscreenImage(result.assets[0].uri, type)
}

export async function takeUserSunscreenPhoto(
  type: ImageType
): Promise<[string, string | null] | null> {
  const { status } = await requestCameraPermissionsAsync()
  if (status !== 'granted') return null

  const result = await launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
  })

  if (result.canceled) return null

  return await stageUserSunscreenImage(result.assets[0].uri, type)
}

export async function commitUserSunscreenImage(
  userSunscreenId: number,
  stagedUri: string,
  type: ImageType
): Promise<string> {
  const dir = new Directory(Paths.document, 'images/user_sunscreen')
  if (!dir.exists) dir.create({ intermediates: true })

  const dest = new File(dir, `${userSunscreenId}_${type}.jpg`)
  if (dest.exists) dest.delete()

  const staged = new File(stagedUri)
  staged.move(dest)

  return `${dest.uri}?v=${Date.now()}`
}

export function discardCommittedUserSunscreenImage(
  userSunscreenId: number,
  type: ImageType
): void {
  const dir = new Directory(Paths.document, 'images/user_sunscreen')
  const file = new File(dir, `${userSunscreenId}_${type}.jpg`)
  if (file.exists) file.delete()
}

export function discardStagedUserSunscreenImage(stagedUri: string): void {
  try {
    const file = new File(stagedUri)
    if (file.exists) file.delete()
  } catch (error) {
    console.log(
      `Failed To Discard Staged Image: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
