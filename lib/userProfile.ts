import { PROFILE_SCREEN_BG_COLOR } from '@/lib/constants'
import { Directory, File, Paths } from 'expo-file-system'
import { ImageManipulator } from 'expo-image-manipulator'
import {
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker'
import { SQLiteDatabase } from 'expo-sqlite'
import { getColors } from 'react-native-image-colors'
import {
  colorDistance,
  getImageSize,
  getLuminance,
  hexToRGB,
  RGB,
  rgbToHex,
} from './imageColor'

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
    UPDATE user_profile
    SET display_name = COALESCE(?, display_name),
        bio = COALESCE(?, bio),
        skin_type = COALESCE(?, skin_type),
        profile_image_uri = COALESCE(?, profile_image_uri),
        image_border_color = COALESCE(?, image_border_color),
        updated_at = ?
    WHERE user_id = ?`,
    data.display_name ?? null,
    data.bio ?? null,
    data.skin_type ?? null,
    data.profile_image_uri ?? null,
    data.image_border_color ?? null,
    now,
    userId
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

const EDGE_STRIP_FRACTION = 0.1 // 0-1
const WHITE_EDGE_THRESHOLD = 200 // 0-255
const DARK_EDGE_THRESHOLD = 70 // 0-255
const COLOR_DISTANCE = 44 // 0-442

type Crop = { originX: number; originY: number; width: number; height: number }
type Clusters = { samples: RGB[]; centroid: RGB }

async function sampleBorder(uri: string, crop: Crop): Promise<RGB | null> {
  let croppedURI: string | undefined

  try {
    const image = await ImageManipulator.manipulate(uri).crop(crop).renderAsync()
    const saved = await image.saveAsync()
    croppedURI = saved.uri

    const result = await getColors(croppedURI, {
      fallback: PROFILE_SCREEN_BG_COLOR,
    })

    const color =
      result.platform === 'ios'
        ? result.background
        : result.platform === 'android' || result.platform === 'web'
          ? result.dominant
          : null

    return color ? hexToRGB(color) : null
  } catch (error) {
    console.log(
      `Error: ${error instanceof Error ? error.message : String(error)} in sampling edge ${JSON.stringify(crop)}`
    )
    return null
  } finally {
    if (croppedURI) new File(croppedURI).delete()
  }
}

function clusterSamples(samples: RGB[]): RGB[][] {
  const clusters: Clusters[] = []

  for (const s of samples) {
    const cluster = clusters.find((c) => colorDistance(c.centroid, s) <= COLOR_DISTANCE)

    if (cluster) {
      const count = cluster.samples.length
      cluster.centroid = cluster.centroid.map(
        (v, i) => (v * count + s[i]) / (count + 1)
      ) as RGB
      cluster.samples.push(s)
    } else {
      clusters.push({ samples: [s], centroid: s })
    }
  }

  return clusters.map((c) => c.samples)
}

async function getBorderColor(uri: string): Promise<string | null> {
  try {
    const { width, height } = await getImageSize(uri)
    const cropWidth = Math.max(1, Math.round(width * EDGE_STRIP_FRACTION))
    const cropHeight = Math.max(1, Math.round(height * EDGE_STRIP_FRACTION))

    const borderCrops: Crop[] = [
      { originX: 0, originY: 0, width, height: cropHeight },
      { originX: 0, originY: height - cropHeight, width, height: cropHeight },
      { originX: 0, originY: 0, width: cropWidth, height },
      { originX: width - cropWidth, originY: 0, width: cropWidth, height },
    ]

    let borderSamples = (
      await Promise.all(borderCrops.map((crop) => sampleBorder(uri, crop)))
    ).filter((sample) => sample !== null)

    if (borderSamples.length === 0) return null

    const brightest = borderSamples.reduce((a, b) =>
      getLuminance(b) > getLuminance(a) ? b : a
    )
    const darkest = borderSamples.reduce((a, b) =>
      getLuminance(b) < getLuminance(a) ? b : a
    )

    if (borderSamples.length > 1 && getLuminance(brightest) >= WHITE_EDGE_THRESHOLD)
      borderSamples = borderSamples.filter((sample) => sample !== brightest)

    if (borderSamples.length > 1 && getLuminance(darkest) <= DARK_EDGE_THRESHOLD)
      borderSamples = borderSamples.filter((sample) => sample !== darkest)

    const clusters = clusterSamples(borderSamples)
    const mainCluster = clusters.reduce((a, b) => (b.length > a.length ? b : a))
    const blended = mainCluster.reduce<RGB>(
      (acc, rgb) => acc.map((channel, i) => channel + rgb[i] / mainCluster.length) as RGB,
      [0, 0, 0]
    )

    return rgbToHex(blended)
  } catch (error) {
    console.log(
      `Error: ${error instanceof Error ? error.message : String(error)} in getBorderColor`
    )
    return null
  }
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
