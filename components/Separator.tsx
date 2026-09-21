import { SEPARATOR } from '@/lib/constants'
import { LinearGradient, LinearGradientProps } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'

interface SeperatorProps {
  height?: number
  color?: string
  gradient?: Pick<LinearGradientProps, 'colors' | 'start' | 'end' | 'locations'>
}

const Separator = ({
  height = StyleSheet.hairlineWidth,
  color = SEPARATOR,
  gradient,
}: SeperatorProps) => {
  if (gradient) {
    return (
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        {...gradient}
        style={{ width: '100%', height }}
      />
    )
  }
  
  return <View style={{ width: '100%', height, backgroundColor: color }} />
}

export default Separator
