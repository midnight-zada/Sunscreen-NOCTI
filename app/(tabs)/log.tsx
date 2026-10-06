import BorderButton from '@/components/BorderButton'
import DebugUserSunscreen from '@/components/dev/DebugUserSunscreen'
import Separator from '@/components/Separator'
import SunscreenCard from '@/components/SunscreenCard'
import { useUserSunscreens } from '@/context/UserSunscreenContext'
import {
  MAIN_BACKGROUND,
  MAIN_BG_DARK,
  PROFILE_BACKGROUND,
  PROFILE_ICON,
  PROFILE_TEXT,
  SEPARATOR,
} from '@/lib/constants'
import { SORT_OPTIONS } from '@/lib/userSunscreen'
import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ms, scale, ScaledSheet } from 'react-native-size-matters'

const CHIP_RADIUS = 16

export default function LogScreen() {
  const insets = useSafeAreaInsets()
  const {
    userSunscreenList,
    sortOption,
    setSortOption,
    sortDirection,
    toggleSortDirection,
    getById,
    refreshUserSunscreens,
  } = useUserSunscreens()

  const [focusedId, setFocusedId] = useState<string | number | null>(null)
  const focusedSunscreen =
    (focusedId !== null ? getById(focusedId) : undefined) ?? userSunscreenList[0] ?? null

  useFocusEffect(
    useCallback(() => {
      refreshUserSunscreens()
    }, [refreshUserSunscreens])
  )

  const openEditSunscreen = (id: number) => {
    router.push({ pathname: '/editUserSunscreen', params: { id } })
  }

  const openMoreInfo = (id: number) => {
    router.push({ pathname: '/viewUserSunscreen', params: { id } })
  }

  return (
    <View style={styles.log}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingBlockStart: insets.top }]}>
        <View style={styles.headerOptions}>
          <Text style={styles.headerText}>Sunscreens</Text>
        </View>
      </View>
      <Separator />
      <View style={styles.sortHeader}>
        <FlatList
          style={styles.sortHeaderList}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SORT_OPTIONS}
          keyExtractor={(option) => option.value}
          contentContainerStyle={styles.sortHeaderContent}
          renderItem={({ item: option }) => (
            <BorderButton
              style={[
                styles.sortChip,
                sortOption === option.value && styles.sortChipActive,
              ]}
              color={sortOption === option.value ? '#fff' : 'none'}
              borderRadius={ms(CHIP_RADIUS)}
              borderStyle={1}
              onPress={() => setSortOption(option.value)}
            >
              <Text
                style={[
                  styles.sortChipText,
                  sortOption === option.value && styles.sortChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </BorderButton>
          )}
        />
        <Pressable style={styles.sortDirection} onPress={toggleSortDirection}>
          <Ionicons
            name={sortDirection === 'reversed' ? 'arrow-up' : 'arrow-down'}
            size={scale(18)}
            color={PROFILE_TEXT}
          />
        </Pressable>
      </View>
      <Separator />
      <FlatList
        style={styles.list}
        data={userSunscreenList}
        keyExtractor={(value) => value.id.toString()}
        renderItem={({ item }) => (
          <>
            <Separator />
            <Pressable onPress={() => setFocusedId(item.id)}>
              <SunscreenCard
                sunscreen={item}
                isFocused={focusedSunscreen?.id === item.id}
              />
            </Pressable>
          </>
        )}
        ListFooterComponent={
          <>
            <Separator />
            <DebugUserSunscreen refreshLog={refreshUserSunscreens} />
            <View style={{ height: scale(100) }} />
          </>
        }
      />
    </View>
  )
}

const styles = ScaledSheet.create({
  log: {
    flex: 1,
    backgroundColor: MAIN_BACKGROUND,
  },

  header: {
    backgroundColor: PROFILE_BACKGROUND,
  },

  headerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBlockStart: '5@s',
    paddingBlockEnd: '10@s',
  },

  headerText: {
    fontSize: '16@ms',
    fontWeight: 600,
    color: '#fff',
  },

  list: {
    flex: 1,
    backgroundColor: MAIN_BACKGROUND,
  },

  seperator: {
    width: '100%',
    height: 2,
    backgroundColor: '#c5c5c5',
  },

  sortHeader: {
    flexDirection: 'row',
    paddingBlock: '4@s',
    backgroundColor: PROFILE_BACKGROUND,
  },

  sortHeaderList: {
    flex: 1,
  },

  sortHeaderContent: {
    paddingInline: '3%',
    alignItems: 'center',
    gap: '7@s',
  },

  sortChip: {
    paddingBlock: '6@s',
    paddingInline: '12@s',
    borderRadius: `${CHIP_RADIUS}@ms`,
  },

  sortChipActive: {
    backgroundColor: MAIN_BG_DARK,
  },

  sortChipText: {
    fontSize: '13@ms',
    fontWeight: 500,
    color: PROFILE_ICON,
  },

  sortChipTextActive: {
    color: PROFILE_TEXT,
  },

  sortDirection: {
    width: '36@s',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: SEPARATOR,
  },
})
