import { NAVBAR_COLOR_T } from '@/constants/colors'
import { SEPARATOR } from '@/lib/constants'
import { hexToRGB } from '@/lib/imageColor'
import { Ionicons } from '@expo/vector-icons'
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs'
import { useEffect, useRef } from 'react'
import { Pressable, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScaledSheet } from 'react-native-size-matters'
import { BackgroundGradient, BorderGradient } from './BorderButton'

type IconName = keyof typeof Ionicons.glyphMap

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  log: { active: 'add-circle', inactive: 'add-circle-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
}

export default function NavBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const scale = useSharedValue(1)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    scale.value = withSequence(
      withTiming(1.02, { duration: 100, easing: Easing.in(Easing.exp) }),
      withTiming(1, { duration: 200, easing: Easing.out(Easing.linear) })
    )
  }, [state.index, scale])

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <View
      style={[styles.wrapper, { bottom: insets.bottom - 8 }]}
      pointerEvents="box-none"
    >
      <Animated.View style={[styles.blurContainer, animatedContainerStyle]}>
        <BackgroundGradient
          rgb={hexToRGB(SEPARATOR)}
          opacities={[0.7, 0.2]}
          locations={[0.05, 0.5]}
        />
        <BorderGradient
          rgb={hexToRGB(SEPARATOR)}
          radius={28}
          offset={0.03}
          opacity={0.7}
        />
        {state.routes.map((route, index) => {
          const isActive = state.index === index
          const icons = ICONS[route.name] ?? ICONS.index
          const isAdd = route.name === 'log'

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={[isActive ? styles.activeTab : null, styles.tabButton]}
              hitSlop={4}
            >
              <Ionicons
                name={isActive ? icons.active : icons.inactive}
                size={isActive ? 28 : 26}
                color={isAdd ? 'rgb(255, 255, 255)' : isActive ? '#ff8c20' : '#fff'}
              />
            </Pressable>
          )
        })}
      </Animated.View>
    </View>
  )
}

const styles = ScaledSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  blurContainer: {
    flexDirection: 'row',
    width: '88%',
    borderRadius: 32,
    padding: 4,
    backgroundColor: NAVBAR_COLOR_T,
    overflow: 'hidden',
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: '8@s',
    borderRadius: 32,
  },

  activeTab: {
    backgroundColor: SEPARATOR,
  },
})
