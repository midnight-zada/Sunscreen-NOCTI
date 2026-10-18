import { getBWContrast, hexToRGBA, isValidStrippedHex } from '@/lib/imageColor'
import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import { ScaledSheet, ms, scale } from 'react-native-size-matters'

interface SunscreenImageOutlineProps {
  size?: number
  color?: string
  scaleType?: 'none' | 'scale' | 'ms'
  type: 'solid' | 'card'
}

const BORDER_RADIUS = 3.5
const BORDER_WIDTH = 20

const SunscreenImageOutline = ({
  size = 10,
  color = '#fff',
  scaleType = 'ms',
  type,
}: SunscreenImageOutlineProps) => {
  const validColor = isValidStrippedHex(color.replace('#', '')) ? color : '#fff'

  const scaledSize =
    scaleType === 'scale' ? scale(size) : scaleType === 'ms' ? ms(size) : size

  return (
    <View
      style={[
        styles.solidBorder,
        {
          backgroundColor: type === 'card' ? validColor : 'transparent',
          width: scaledSize,
          borderWidth: scaledSize / BORDER_WIDTH,
          borderColor: validColor,
          borderRadius: scaledSize / BORDER_RADIUS,
        },
      ]}
    >
      <View
        style={[
          styles.solid,
          {
            width: scaledSize / 1.33,
            backgroundColor: validColor,
            borderRadius: scaledSize / (1.66 * BORDER_RADIUS),
          },
        ]}
      >
        <Ionicons
          name="image"
          size={type === 'card' ? scaledSize / 1.33 : scaledSize / 1.66}
          color={hexToRGBA(getBWContrast(validColor), 0.6)}
        />
      </View>
    </View>
  )
}

export default SunscreenImageOutline

const styles = ScaledSheet.create({
  solidBorder: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  solid: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
