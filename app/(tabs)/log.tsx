import DebugUserSunscreen from '@/components/dev/DebugUserSunscreen'
import SunscreenCard from '@/components/SunscreenCard'
import { useAppContext } from '@/context/AppContext'
import { PROFILE_SCREEN_BG_COLOR } from '@/lib/constants'
import { getActiveUserSunscreens, UserSunscreen } from '@/lib/userSunscreen'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scale, ScaledSheet } from 'react-native-size-matters'

export default function LogScreen() {
  const insets = useSafeAreaInsets()
  const { db, userId } = useAppContext()

  const [focusedSunscreen, setFocusedSunscreen] = useState<UserSunscreen | null>(null)
  const [userSunscreens, setUserSunscreens] = useState<UserSunscreen[] | null>(null)
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  const refreshLog = useCallback(async () => {
    const data = await getActiveUserSunscreens(db)

    setUserSunscreens(data)
    setFocusedSunscreen((prevFocused) => {
      if (prevFocused === null) return data[0] ?? null

      const updated = data.find((sunscreen) => sunscreen.id === prevFocused.id)
      return updated ?? prevFocused
    })
  }, [db, userId])

  useFocusEffect(
    useCallback(() => {
      refreshLog()
    }, [refreshLog])
  )

  return (
    <View style={[styles.log, { paddingBlockStart: insets.top }]}>
      {focusedSunscreen ? (
        <View style={styles.focusedSection}>
          {focusedSunscreen.nickname === null ? (
            <View style={styles.nameSection}>
              <Text style={styles.nameText}>{focusedSunscreen.name}</Text>
              {focusedSunscreen.brand && (
                <Text style={[styles.subNameText]}>by {focusedSunscreen.brand}</Text>
              )}
            </View>
          ) : (
            <View style={styles.nameSection}>
              <Text style={styles.nameText}>{focusedSunscreen.nickname}</Text>
              {focusedSunscreen.brand && (
                <View style={[styles.subNameSection]}>
                  <Text style={styles.subNameText}>{focusedSunscreen.name}</Text>
                  <Text style={{ color: '#5c5c5c' }}>by</Text>
                  <Text style={styles.subNameText}>{focusedSunscreen.brand}</Text>
                </View>
              )}
            </View>
          )}
          <Pressable
            style={styles.showMoreButton}
            onPress={() => setShowMoreInfo((prev) => !prev)}
          >
            <Text style={styles.showMoreText}>Show More</Text>
          </Pressable>
          {/* <View style={styles.focusedMain}>
            <View style={styles.focusedMainInfo}>
              <Text style={styles.focusedMainSPF}>SPF {focusedSunscreen.spf}</Text>
              <View>
                <Text style={styles.focusedMainHeading}>Duration</Text>
                <View style={styles.seperator} />
                <Text style={styles.focusedMainText}>
                  {formatDuration(focusedSunscreen.duration)}
                </Text>
              </View>
              <View>
                <Text style={styles.focusedMainHeading}>Water Resistant</Text>
                <View style={styles.seperator} />
                <Text style={styles.focusedMainText}>
                  {focusedSunscreen.water_duration
                    ? formatDuration(focusedSunscreen.water_duration)
                    : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.focusedMainInfo}>
              <View>
                <Text style={styles.focusedMainHeading}>Type</Text>
                <View style={styles.seperator} />
                <Text style={styles.focusedMainText}>
                  {focusedSunscreen.type ? focusedSunscreen.type : 'N/A'}
                </Text>
              </View>
              <View>
                <Text style={styles.focusedMainHeading}>Form</Text>
                <View style={styles.seperator} />
                <Text style={styles.focusedMainText}>
                  {focusedSunscreen.form ? focusedSunscreen.form : 'N/A'}
                  {focusedSunscreen.is_favorite}
                </Text>
              </View>
              <View>
                <Text style={styles.focusedMainHeading}>Coverage</Text>
                <View style={styles.seperator} />
                <Text style={styles.focusedMainText}>
                  {focusedSunscreen.coverage ? focusedSunscreen.coverage : 'N/A'}
                </Text>
              </View>
            </View>
          </View> */}
        </View>
      ) : (
        <View style={styles.focusedSection}></View>
      )}
      <View style={styles.seperator} />
      <FlatList
        style={styles.list}
        data={userSunscreens ?? []}
        keyExtractor={(value) => value.id.toString()}
        renderItem={({ item }) => (
          <>
            <Pressable onPress={() => setFocusedSunscreen(item)}>
              <SunscreenCard
                sunscreen={item}
                refreshLog={refreshLog}
                isFocused={focusedSunscreen?.id === item.id}
              />
            </Pressable>
            <View style={styles.seperator} />
          </>
        )}
        ListHeaderComponent={
          <>
            <View style={styles.sortHeader}></View>
            <View style={styles.seperator} />
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
    backgroundColor: PROFILE_SCREEN_BG_COLOR,
  },

  focusedSection: {
    paddingInline: '3%',
    minHeight: '114@s',
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
    color: '#1f1f1f',
    fontWeight: 600,
  },

  subNameText: {
    fontSize: '18@ms',
    fontWeight: 500,
    color: '#5c5c5c',
  },

  subNameSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 3,
    rowGap: 0,
  },

  showMoreButton: {
    width: '100%',
    paddingBlock: '5@s',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#c5c5c5',
    borderRadius: 5,
  },

  showMoreText: {
    fontSize: '16@ms',
    fontWeight: 500,
  },

  focusedMain: {
    flexDirection: 'row',
  },

  focusedImage: {
    width: '120@s',
    aspectRatio: 1,
    borderRadius: 13,
  },

  focusedMainInfo: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingInlineEnd: '12@s',
  },

  focusedMainHeading: {
    fontSize: '16@ms',
    fontWeight: 400,
  },

  focusedMainSPF: {
    flex: 1,
    fontSize: '30@ms',
    fontWeight: 600,
  },

  focusedMainText: {
    fontSize: '18@ms',
    fontWeight: 600,
  },

  list: {
    flex: 1,
    backgroundColor: '#ececec',
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
