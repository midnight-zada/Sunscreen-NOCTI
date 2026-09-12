import { useEffect, useRef } from 'react'
import { Animated, Easing, View } from 'react-native'

type LoadingDotsProps = {
  color?: string
  size?: number
}

const DELAY = 180
const RISE = 320
const FALL = 320
const CYCLE_TIME = DELAY * 3 + RISE + FALL
const FRAMES = 12

const buildRanges = (index: number, size: number) => {
  const start = index * DELAY
  const inputRange: number[] = [0]
  const outputRange: number[] = [0]

  for (let i = 1; i <= FRAMES; i++) {
    const t = i / FRAMES
    inputRange.push((start + t * RISE) / CYCLE_TIME)
    outputRange.push(-size * Easing.inOut(Easing.sin)(t))
  }

  for (let i = 1; i <= FRAMES; i++) {
    const t = i / FRAMES
    inputRange.push((start + RISE + t * FALL) / CYCLE_TIME)
    outputRange.push(-size * (1 - Easing.inOut(Easing.sin)(t)))
  }

  inputRange.push(1)
  outputRange.push(0)

  return { inputRange, outputRange }
}

export const LoadingDots = ({ color = '#000', size = 7 }: LoadingDotsProps) => {
  const driver = useRef(new Animated.Value(0)).current

  useEffect(() => {
    driver.setValue(0)
    const animation = Animated.loop(
      Animated.timing(driver, {
        toValue: 1,
        duration: CYCLE_TIME,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )

    animation.start()

    return () => animation.stop()
  }, [driver])

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.8 }}>
      {[0, 1, 2].map((index) => {
        const { inputRange, outputRange } = buildRanges(index, size)

        return (
          <Animated.View
            key={index}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              transform: [
                {
                  translateY: driver.interpolate({
                    inputRange,
                    outputRange,
                  }),
                },
              ],
            }}
          />
        )
      })}
    </View>
  )
}

export default LoadingDots
