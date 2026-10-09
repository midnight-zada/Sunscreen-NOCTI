import BorderButton from '@/components/BorderButton'
import DebugUserSunscreen from '@/components/dev/DebugUserSunscreen'
import Separator from '@/components/Separator'
import SunscreenCard from '@/components/SunscreenCard'
import { HEADER_TITLE_SIZE } from '@/constants/text'
import { useUserSunscreens } from '@/context/UserSunscreenContext'
import {
  FONT_HEADER,
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

  return (
    <View style={styles.log}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingBlockStart: insets.top }]}>
        <View style={styles.headerTextSection}>
          <View style={styles.headerButton} />
          <Text style={styles.headerText}>Sunscreens</Text>
          <View
            style={[
              styles.headerButton,
              {
                alignItems: 'flex-end',
              },
            ]}
          >
            <Pressable
              onPress={() =>
                router.push({ pathname: '/editUserSunscreen', params: { id: -1 } })
              }
              hitSlop={ms(5)}
            >
              <Ionicons name="add" size={ms(22)} color={PROFILE_TEXT} />
            </Pressable>
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
      </View>
      <Separator />
      <FlatList
        style={styles.list}
        showsVerticalScrollIndicator={false}
        data={userSunscreenList}
        keyExtractor={(value) => value.id.toString()}
        renderItem={({ item }) => (
          <>
            <Separator height={1} />
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
            <Separator height={0.8} />
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

  headerTextSection: {
    paddingInline: '3%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBlockStart: '5@s',
    paddingBlockEnd: '10@s',
  },

  headerButton: {
    width: '20%',
  },

  headerText: {
    fontSize: `${HEADER_TITLE_SIZE}@ms`,
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
