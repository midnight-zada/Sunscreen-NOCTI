import { SEPARATOR } from '@/lib/constants'
import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode, useState } from 'react'
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native'
import Svg, {
  Defs,
  LinearGradient as LinearGradientSVG,
  Path,
  Stop,
} from 'react-native-svg'

const EDGE_STROKE_WIDTH = 1

interface RGB {
  r: number
  g: number
  b: number
}

const hexToRgb = (hex: string): RGB => {
  const normalized = hex.replace('#', '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized
  const value = parseInt(full, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

interface BorderButtonProps extends Omit<PressableProps, 'style'> {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  backgroundColor?: string
  color?: string | 'none'
  borderRadius?: number
  borderStyle?: 0 | 1 | 2
}

interface BackgroundGradientProps {
  rgb: RGB
  opacities: [number, number]
  locations: [number, number]
}

interface BorderGradientProps {
  rgb: RGB
  radius: number
  offset: number
  opacity: number
}

const BackgroundGradient = ({ rgb, opacities, locations }: BackgroundGradientProps) => (
  <LinearGradient
    colors={[
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacities[0]})`,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacities[1]})`,
      'transparent',
      'transparent',
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacities[1]})`,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacities[0]})`,
    ]}
    locations={[0, locations[0], locations[1], 1 - locations[1], 1 - locations[0], 1]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={StyleSheet.absoluteFill}
    pointerEvents="none"
  />
)

const BorderGradient = ({ rgb, radius, offset, opacity }: BorderGradientProps) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout
        setSize({ width, height })
      }}
    >
      {size &&
        (() => {
          const halfStroke = EDGE_STROKE_WIDTH / 2
          const topEdge = halfStroke
          const bottomEdge = size.height - halfStroke

          return (
            <Svg width={size.width} height={size.height}>
              <Defs>
                <LinearGradientSVG
                  id="buttonEdgeFade"
                  x1="0"
                  y1="0"
                  x2={size.width}
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop
                    offset={0}
                    stopColor={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                    stopOpacity={0}
                  />
                  <Stop
                    offset={offset}
                    stopColor={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                    stopOpacity={opacity}
                  />
                  <Stop
                    offset={1 - offset}
                    stopColor={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                    stopOpacity={opacity}
                  />
                  <Stop
                    offset={1}
                    stopColor={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                    stopOpacity={0}
                  />
                </LinearGradientSVG>
              </Defs>
              <Path
                d={`M0,${radius} A${radius},${radius} 0 0 1 ${radius},${topEdge} L${size.width - radius},${topEdge} A${radius},${radius} 0 0 1 ${size.width},${radius}`}
                stroke="url(#buttonEdgeFade)"
                strokeWidth={EDGE_STROKE_WIDTH}
                fill="none"
              />
              <Path
                d={`M${size.width},${size.height - radius} A${radius},${radius} 0 0 1 ${size.width - radius},${bottomEdge} L${radius},${bottomEdge} A${radius},${radius} 0 0 1 0,${size.height - radius}`}
                stroke="url(#buttonEdgeFade)"
                strokeWidth={EDGE_STROKE_WIDTH}
                fill="none"
              />
            </Svg>
          )
        })()}
    </View>
  )
}

const BorderButton = ({
  children,
  style,
  backgroundColor,
  color = '#fff',
  borderRadius = 0,
  borderStyle = 0,
  ...pressableProps
}: BorderButtonProps) => {
  const rgb = color !== 'none' ? hexToRgb(color) : null

  let bgOpacity: [number, number]
  let bgLocations: [number, number]

  let borderOffset: number
  let borderOpacity: number
  if (borderStyle === 2) {
    bgOpacity = [0.15, 0.1]
    bgLocations = [0.03, 0.2]
    borderOffset = 0.1
    borderOpacity = 0.15
  } else if (borderStyle === 1) {
    bgOpacity = [0.1, 0.1]
    bgLocations = [0.01, 0.2]
    borderOffset = 0.2
    borderOpacity = 0.2
  } else {
    bgOpacity = [0.15, 0.1]
    bgLocations = [0.07, 0.2]
    borderOffset = 0.1
    borderOpacity = 0.3
  }

  return (
    <Pressable
      style={[
        { backgroundColor, borderRadius, position: 'relative', overflow: 'hidden' },
        style,
      ]}
      {...pressableProps}
    >
      {rgb && (
        <>
          <BackgroundGradient
            rgb={rgb}
            opacities={bgOpacity}
            locations={bgLocations}
          />
          <BorderGradient
            rgb={rgb}
            radius={borderRadius}
            offset={borderOffset}
            opacity={borderOpacity}
          />
        </>
      )}
      {children}
    </Pressable>
  )
}

export default BorderButton
