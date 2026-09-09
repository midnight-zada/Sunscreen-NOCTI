import { Image } from 'expo-image'

export type RGB = [number, number, number]

export const getImageSize = async (
  uri: string
): Promise<{ width: number; height: number }> => {
  const { width, height } = await Image.loadAsync(uri)
  return { width, height }
}

export const hexToRGB = (hex: string): [number, number, number] => {
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