import { SEPARATOR } from '@/lib/constants'
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { scale } from 'react-native-size-matters'

interface SeperatorProps {
  height?: number
  color?: string
  gradient?: Pick<LinearGradientProps, 'colors' | 'start' | 'end' | 'locations'>
  scaleMargin?: [number, number] | number
  style?: StyleProp<ViewStyle>
}

const Separator = ({
  height = StyleSheet.hairlineWidth,
  color = SEPARATOR,
  gradient,
  scaleMargin,
  style,
}: SeperatorProps) => {
  const [scaleStart, scaleEnd] = Array.isArray(scaleMargin)
    ? scaleMargin
    : [scaleMargin, scaleMargin]
  const marginBlockStart = scaleStart !== undefined ? scale(scaleStart) : undefined
  const marginBlockEnd = scaleEnd !== undefined ? scale(scaleEnd) : undefined

  if (gradient) {
    return (
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        {...gradient}
        style={[{ width: '100%', height, marginBlockStart, marginBlockEnd }, style]}
      />
    )
  }

  return (
    <View
      style={[
        {
          width: '100%',
          height,
          backgroundColor: color,
          marginBlockStart,
          marginBlockEnd,
        },
        style,
      ]}
    />
  )
}

export default Separator
