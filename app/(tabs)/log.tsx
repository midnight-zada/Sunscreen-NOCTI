import DebugUserSunscreen from '@/components/dev/DebugUserSunscreen'
import Separator from '@/components/Separator'
import SunscreenCard from '@/components/SunscreenCard'
import { useUserSunscreens } from '@/context/UserSunscreenContext'
import {
  ACTIVITY_BACKGROUND,
  MAIN_BACKGROUND,
  MODAL_BUTTONS,
  PROFILE_BACKGROUND,
  PROFILE_ICON,
  PROFILE_SECONDARY,
  PROFILE_TEXT,
  SEPARATOR,
} from '@/lib/constants'
import { router, useFocusEffect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scale, ScaledSheet } from 'react-native-size-matters'

export default function LogScreen() {
  const insets = useSafeAreaInsets()
  const {
    userSunscreens,
    getById,
    refreshUserSunscreens: refreshLog,
  } = useUserSunscreens()

  const [focusedId, setFocusedId] = useState<string | number | null>(null)
  const focusedSunscreen =
    (focusedId !== null ? getById(focusedId) : undefined) ?? userSunscreens[0] ?? null

  useFocusEffect(
    useCallback(() => {
      refreshLog()
    }, [refreshLog])
  )

  const openEditSunscreen = (id: number) => {
    router.push({ pathname: '/editUserSunscreen', params: { id } })
  }

  const openMoreInfo = (id: number) => {
    router.push({ pathname: '/viewUserSunscreen', params: { id } })
  }

  return (
    <View style={[styles.log, { paddingBlockStart: insets.top }]}>
      <StatusBar style="light" />
      {focusedSunscreen ? (
        <View style={styles.focusedSection}>
          {focusedSunscreen.nickname === null ? (
            <View style={styles.nameSection}>
              <Text style={styles.nameText} numberOfLines={1}>
                {focusedSunscreen.name}
              </Text>
              {focusedSunscreen.brand && (
                <Text style={[styles.subNameText]} numberOfLines={2}>
                  <Text style={styles.by}>by</Text> {focusedSunscreen.brand}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.nameSection}>
              <Text style={styles.nameText} numberOfLines={1}>
                {focusedSunscreen.nickname}
              </Text>
              {focusedSunscreen.brand && (
                <View style={[styles.subNameSection]}>
                  <Text style={styles.subNameText} numberOfLines={1}>
                    {focusedSunscreen.name}{' '}
                    <Text style={styles.by}>{focusedSunscreen.brand && 'by'}</Text>
                  </Text>
                  <Text style={styles.subNameText} numberOfLines={1}>
                    {focusedSunscreen.brand}
                  </Text>
                </View>
              )}
            </View>
          )}
          <View style={styles.buttonSection}>
            <Pressable
              style={styles.editButton}
              onPress={() => {
                if (focusedSunscreen) openEditSunscreen(focusedSunscreen.id)
              }}
            >
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
            <Pressable
              style={styles.showMoreButton}
              onPress={() => {
                if (focusedSunscreen) openMoreInfo(focusedSunscreen.id)
              }}
            >
              <Text style={styles.showMoreText}>More Info</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.focusedSection}></View>
      )}
      <Separator />
      <FlatList
        style={styles.list}
        data={userSunscreens}
        keyExtractor={(value) => value.id.toString()}
        renderItem={({ item }) => (
          <>
            <Pressable onPress={() => setFocusedId(item.id)}>
              <SunscreenCard
                sunscreen={item}
                isFocused={focusedSunscreen?.id === item.id}
              />
            </Pressable>
            <Separator />
          </>
        )}
        ListHeaderComponent={
          <>
            <View style={styles.sortHeader}></View>
            <Separator />
          </>
        }
        ListFooterComponent={
          <>
            <DebugUserSunscreen refreshLog={refreshLog} />
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

  focusedSection: {
    paddingInline: '3%',
    height: '114@s',
    justifyContent: 'flex-end',
    gap: '6@s',
    paddingBlockEnd: '6@s',
  },

  nameSection: {
    flex: 1,
    justifyContent: 'center',
  },

  nameText: {
    fontSize: '30@ms',
    color: PROFILE_TEXT,
    fontWeight: 600,
  },

  subNameText: {
    fontSize: '18@ms',
    fontWeight: 500,
    color: PROFILE_ICON,
  },

  by: {
    fontSize: '16@ms',
    fontWeight: 400,
  },

  subNameSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 3,
    rowGap: 0,
  },

  buttonSection: {
    flexDirection: 'row',
    gap: '10@s',
  },

  editButton: {
    flex: 1,
    paddingBlock: '5@s',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: '2@s',
    borderColor: SEPARATOR,
    borderRadius: 4,
  },

  editText: {
    fontSize: '15@ms',
    fontWeight: 500,
    color: PROFILE_TEXT,
  },

  showMoreButton: {
    flex: 1,
    paddingBlock: '5@s',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SEPARATOR,
    borderRadius: 4,
  },

  showMoreText: {
    fontSize: '15@ms',
    fontWeight: 500,
    color: PROFILE_TEXT,
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
    height: '36@s',
  },
})
