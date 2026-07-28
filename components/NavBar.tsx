import { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { debug } from '@/constants/debug';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  log: { active: 'add-circle', inactive: 'add-circle-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

export default function GlassNavBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scale.value = withSequence(
      withTiming(1.02, { duration: 100, easing: Easing.in(Easing.exp) }),
      withTiming(1, { duration: 200, easing: Easing.out(Easing.linear) })
    );
  }, [state.index, scale]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      style={[styles.wrapper, { bottom: insets.bottom - 8 }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[styles.blurContainer, animatedContainerStyle]}
      >
        {state.routes.map((route, index) => {
          const isActive = state.index === index;
          const icons = ICONS[route.name] ?? ICONS.index;
          const isAdd = route.name === 'log';

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
                color={isAdd ? '#444444' : isActive ? '#ee7700' : 'rgba(60,60,67,0.6)'}
              />
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(111, 111, 111, 0.1)',
    backgroundColor: '#d1d1d1',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: 10,
    borderRadius: 32,
  },
  activeTab: {
    backgroundColor: 'rgba(111, 111, 111, 0.3)',
  }
});