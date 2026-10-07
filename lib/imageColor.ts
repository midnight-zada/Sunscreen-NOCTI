import { PROFILE_SCREEN_BG_COLOR } from '@/lib/constants'
import { File } from 'expo-file-system'
import { Image } from 'expo-image'
import { ImageManipulator } from 'expo-image-manipulator'
import { getColors } from 'react-native-image-colors'

import type { ImageRef } from 'expo-image-manipulator'

export type RGB = [number, number, number]

export const getImageSize = async (
  uri: string
): Promise<{ width: number; height: number }> => {
  const { width, height } = await Image.loadAsync(uri)
  return { width, height }
}

export const hexToRGB = (hex: string): RGB => {
  const stripped = hex.replace('#', '')

  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(stripped))
    throw new Error(`Invalid Hex Color: ${hex}`)

  const expanded =
    stripped.length === 3
      ? stripped
          .split('')
          .map((c) => c + c)
          .join('')
      : stripped

  const n = parseInt(expanded, 16)

  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const rgbClamp = (c: number): number => Math.max(0, Math.min(255, Math.round(c)))

export const rgbToHex = ([r, g, b]: [number, number, number]): string =>
  `#${[r, g, b].map((c) => rgbClamp(c).toString(16).padStart(2, '0')).join('')}`

export const getLuminance = ([r, g, b]: [number, number, number]): number => {
  const [cR, cG, cB] = [r, g, b].map(rgbClamp)
  return 0.299 * cR + 0.587 * cG + 0.114 * cB
}

export const colorDistance = (
  a: [number, number, number],
  b: [number, number, number]
): number => {
  const [aR, aG, aB] = a.map(rgbClamp)
  const [bR, bG, bB] = b.map(rgbClamp)

  return Math.hypot(aR - bR, aG - bG, aB - bB)
}

export const getBWContrast = (hexColor: string | null) => {
  if (!hexColor) return '#fff'

  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#000' : '#fff'
}

const EDGE_STRIP_FRACTION = 0.1 // 0-1
const WHITE_EDGE_THRESHOLD = 200 // 0-255
const DARK_EDGE_THRESHOLD = 70 // 0-255
const COLOR_DISTANCE = 44 // 0-442

type Crop = { originX: number; originY: number; width: number; height: number }
type Clusters = { samples: RGB[]; centroid: RGB }

export async function sampleBorder(uri: string, crop: Crop): Promise<RGB | null> {
  let croppedURI: string | undefined
  let image: ImageRef | undefined

  try {
    image = await ImageManipulator.manipulate(uri).crop(crop).renderAsync()
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
    image?.release()
    if (croppedURI) new File(croppedURI).delete()
  }
}

export function clusterSamples(samples: RGB[]): RGB[][] {
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

export async function getBorderColor(uri: string): Promise<string | null> {
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
