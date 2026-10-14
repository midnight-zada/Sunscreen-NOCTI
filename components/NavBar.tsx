import { NAVBAR_COLOR_T } from '@/constants/colors'
import { hexToRGB } from '@/lib/imageColor'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { GlassView } from 'expo-glass-effect'
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs'
import { useEffect, useRef } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScaledSheet } from 'react-native-size-matters'
import { BorderGradient } from './BorderButton'

const AnimatedGlassView = Animated.createAnimatedComponent(GlassView)

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
      <AnimatedGlassView style={[styles.navbar, animatedContainerStyle]}>
        <BlurView intensity={8} tint="dark" style={StyleSheet.absoluteFill} />
        <BorderGradient rgb={hexToRGB('#fff')} radius={32} offset={0.05} opacity={0.1} />
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
      </AnimatedGlassView>
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

  navbar: {
    flexDirection: 'row',
    width: '88%',
    borderRadius: 34,
    backgroundColor: NAVBAR_COLOR_T,
    overflow: 'hidden',
    padding: '5@s',
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: '8@s',
    borderRadius: 34,
  },

  activeTab: {
    backgroundColor: 'rgba(129, 132, 136, 1)',
  },
})
