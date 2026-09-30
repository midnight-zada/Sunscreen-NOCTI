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
  Path,
  Stop,
  LinearGradient as LinearGradientSVG,
} from 'react-native-svg'

export const DEFAULT_BORDER_RADIUS = 12

const EDGE_STROKE_WIDTH = 1

interface ButtonProps extends Omit<PressableProps, 'style'> {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  backgroundColor?: string
  borderRadius?: number
}

const BackgroundGradient = () => (
  <LinearGradient
    colors={[
      'rgba(255, 255, 255, 0.2)',
      'rgba(255, 255, 255, 0.1)',
      'transparent',
      'transparent',
      'rgba(255, 255, 255, 0.1)',
      'rgba(255, 255, 255, 0.2)',
    ]}
    locations={[0, 0.01, 0.2, 0.8, 0.99, 1]}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
    style={StyleSheet.absoluteFill}
    pointerEvents="none"
  />
)

const BorderGradient = ({ borderRadius }: { borderRadius: number }) => {
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
                  <Stop offset={0} stopColor="#fff" stopOpacity={0} />
                  <Stop offset={0.1} stopColor="#fff" stopOpacity={0.5} />
                  <Stop offset={0.9} stopColor="#fff" stopOpacity={0.5} />
                  <Stop offset={1} stopColor="#fff" stopOpacity={0} />
                </LinearGradientSVG>
              </Defs>
              <Path
                d={`M0,${borderRadius} A${borderRadius},${borderRadius} 0 0 1 ${borderRadius},${topEdge} L${size.width - borderRadius},${topEdge} A${borderRadius},${borderRadius} 0 0 1 ${size.width},${borderRadius}`}
                stroke="url(#buttonEdgeFade)"
                strokeWidth={EDGE_STROKE_WIDTH}
                fill="none"
              />
              <Path
                d={`M${size.width},${size.height - borderRadius} A${borderRadius},${borderRadius} 0 0 1 ${size.width - borderRadius},${bottomEdge} L${borderRadius},${bottomEdge} A${borderRadius},${borderRadius} 0 0 1 0,${size.height - borderRadius}`}
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

const Button = ({
  children,
  style,
  backgroundColor = SEPARATOR,
  borderRadius = DEFAULT_BORDER_RADIUS,
  ...pressableProps
}: ButtonProps) => (
  <Pressable
    style={[
      { backgroundColor, borderRadius, position: 'relative', overflow: 'hidden' },
      style,
    ]}
    {...pressableProps}
  >
    <BackgroundGradient />
    <BorderGradient borderRadius={borderRadius} />
    {children}
  </Pressable>
)

export default Button
