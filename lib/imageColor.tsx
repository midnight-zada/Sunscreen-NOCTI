import { Buffer } from 'buffer'
import { extractColorsFromImageData } from 'extract-colors'
import { File } from 'expo-file-system'
import { Image } from 'expo-image'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { PNG } from 'pngjs/browser'

import type { ImageRef } from 'expo-image-manipulator'
import { StyleSheet, View } from 'react-native'
import { ms } from 'react-native-size-matters'

export type RGB = [number, number, number]

export const getImageSize = async (
  uri: string
): Promise<{ width: number; height: number }> => {
  const { width, height } = await Image.loadAsync(uri)
  return { width, height }
}

export const isValidStrippedHex = (stripped: string): boolean =>
  /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(stripped)

export const hexToRGB = (hex: string): RGB => {
  const stripped = hex.replace('#', '')

  if (!isValidStrippedHex(stripped)) throw new Error(`Invalid Hex Color: ${hex}`)

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

export const getBWContrast = (hexColor: string | null) => {
  if (!hexColor || !isValidStrippedHex(hexColor.replace('#', ''))) return '#fff'

  const [r, g, b] = hexToRGB(hexColor)

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#000' : '#fff'
}

const EDGE_STRIP_FRACTION = 0.1 // 0-1
const WHITE_EDGE_THRESHOLD = 200 // 0-255
const DARK_EDGE_THRESHOLD = 70 // 0-255

type Crop = { originX: number; originY: number; width: number; height: number }

const BORDER_SAMPLE_MAX_DIMENSION = 100

type Resize = { width?: number; height?: number }

function clampResize(width: number, height: number): Resize | undefined {
  const longest = Math.max(width, height)
  if (longest <= BORDER_SAMPLE_MAX_DIMENSION) return undefined

  return width >= height
    ? { width: BORDER_SAMPLE_MAX_DIMENSION }
    : { height: BORDER_SAMPLE_MAX_DIMENSION }
}

async function getPixelData(
  uri: string,
  options: { crop?: Crop; resize?: Resize }
): Promise<{ data: Uint8ClampedArray; width: number; height: number } | null> {
  let image: ImageRef | undefined
  let savedURI: string | undefined

  try {
    let context = ImageManipulator.manipulate(uri)
    if (options.crop) context = context.crop(options.crop)
    if (options.resize) context = context.resize(options.resize)

    image = await context.renderAsync()
    const saved = await image.saveAsync({ format: SaveFormat.PNG, base64: true })
    savedURI = saved.uri

    if (!saved.base64) return null

    const { data, width, height } = PNG.sync.read(Buffer.from(saved.base64, 'base64'))
    return { data: new Uint8ClampedArray(data), width, height }
  } finally {
    image?.release()
    if (savedURI) new File(savedURI).delete()
  }
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

    const borderPixels = (
      await Promise.all(
        borderCrops.map((crop) =>
          getPixelData(uri, { crop, resize: clampResize(crop.width, crop.height) })
        )
      )
    ).filter((pixels) => pixels !== null)

    if (borderPixels.length === 0) return null

    const mergedData = new Uint8ClampedArray(
      borderPixels.reduce((total, { data }) => total + data.length, 0)
    )
    let offset = 0
    for (const { data } of borderPixels) {
      mergedData.set(data, offset)
      offset += data.length
    }

    const totalPixels = mergedData.length / 4

    const colors = extractColorsFromImageData(
      { data: mergedData, width: totalPixels, height: 1 },
      {
        pixels: totalPixels,
        colorValidator: (r, g, b, a) => {
          if ((a ?? 255) <= 250) return false
          const luminance = getLuminance([r, g, b])
          return luminance > DARK_EDGE_THRESHOLD && luminance < WHITE_EDGE_THRESHOLD
        },
      }
    )

    return colors[0]?.hex ?? null
  } catch (error) {
    console.error(
      `Failed To Get Border Color: ${error instanceof Error ? error.message : String(error)}`
    )
    return null
  }
}

const SWATCH_SAMPLE_WIDTH = 64
const SWATCH_COUNT = 4

export async function getColorSwatch(uri: string): Promise<string[]> {
  try {
    const pixels = await getPixelData(uri, { resize: { width: SWATCH_SAMPLE_WIDTH } })
    if (!pixels) return []

    const colors = extractColorsFromImageData(pixels, {
      pixels: pixels.width * pixels.height,
    })

    return colors.slice(0, SWATCH_COUNT).map((color) => color.hex)
  } catch (error) {
    console.error(
      `Failed To Get Color Swatch: ${error instanceof Error ? error.message : String(error)}`
    )
    return []
  }
}

export const hexToRGBA = (hex: string, opacity: number): string => {
  const [r, g, b] = hexToRGB(hex)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

interface ImageEdgeGradientProps {
  color?: string
  borderRadius?: number
  blur?: number
  spread?: number
  opacity?: number
}

export const ImageEdgeGradient = ({
  color = '#000',
  borderRadius = 0,
  blur = 3,
  spread = 1,
  opacity = 0.8,
}: ImageEdgeGradientProps) => {
  if (color === 'transparent') return null
  const [r, g, b] = hexToRGB(color)

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: borderRadius,
          boxShadow: `inset 0 0 ${ms(blur)}px ${ms(spread)}px rgba(${r}, ${g}, ${b}, ${opacity})`,
        },
      ]}
    />
  )
}
