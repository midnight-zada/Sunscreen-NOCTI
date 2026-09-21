import ErrorScreen from '@/components/ErrorScreen'
import Separator from '@/components/Separator'
import { useAppContext } from '@/context/AppContext'
import { useUserSunscreens } from '@/context/UserSunscreenContext'
import { MAIN_BACKGROUND, PROFILE_ICON, PROFILE_TEXT, SEPARATOR } from '@/lib/constants'
import { formatDuration } from '@/lib/userSunscreen'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Pressable, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ms, ScaledSheet } from 'react-native-size-matters'

const INFO_SEPARATOR_GRADIENT = {
  colors: [SEPARATOR, SEPARATOR, MAIN_BACKGROUND],
  locations: [0, 0.7, 1],
} as const

const editUserSunscreen = () => {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const sunscreenId = Number(id)
  const { getById, toggleFavorite } = useUserSunscreens()

  const sunscreen = getById(sunscreenId)
  const isFavorite = sunscreen?.is_favorite === 1

  const cancelEdit = () => {
    router.back()
  }

  const editSunscreen = () => {
    router.push({ pathname: '/editUserSunscreen', params: { id } })
  }

  return (
    <View
      style={[
        styles.editUserSunscreen,
        {
          paddingBlockStart: insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.headerItem, { alignItems: 'flex-start' }]}>
          <Pressable onPress={cancelEdit} hitSlop={10}>
            <Ionicons
              name="chevron-back"
              size={ms(26)}
              color={PROFILE_ICON}
              style={{ transform: [{ translateY: ms(4) }] }}
            />
          </Pressable>
        </View>
        <View style={styles.headerItem}>
          <Text style={[styles.headerText, styles.headerSunscreen]}>Sunscreen</Text>
        </View>
        <View style={[styles.headerItem, { alignItems: 'flex-end' }]}>
          <Pressable onPress={editSunscreen} hitSlop={10}>
            <Text style={styles.headerText}>Edit</Text>
          </Pressable>
        </View>
      </View>
      <Separator />
      <StatusBar style="light" />
      {sunscreen ? (
        <ScrollView>
          {sunscreen.nickname === null ? (
            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{sunscreen.name}</Text>
                <Pressable onPress={() => toggleFavorite(sunscreenId)} hitSlop={5}>
                  <Ionicons
                    name={isFavorite ? 'star' : 'star-outline'}
                    size={ms(28)}
                    color={isFavorite ? '#ffed4c' : PROFILE_ICON}
                  />
                </Pressable>
              </View>
              {sunscreen.brand && (
                <Text style={[styles.subNameText]}>
                  <Text style={styles.by}>by</Text> {sunscreen.brand}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{sunscreen.nickname}</Text>
                <Pressable onPress={() => toggleFavorite(sunscreenId)} hitSlop={5}>
                  <Ionicons
                    name={isFavorite ? 'star' : 'star-outline'}
                    size={ms(28)}
                    color={isFavorite ? '#ffed4c' : PROFILE_ICON}
                  />
                </Pressable>
              </View>
              {sunscreen.brand && (
                <View style={[styles.subNameSection]}>
                  <Text style={styles.subNameText}>
                    {sunscreen.name}{' '}
                    <Text style={styles.by}>{sunscreen.brand && 'by'}</Text>
                  </Text>
                  <Text style={styles.subNameText}>{sunscreen.brand}</Text>
                </View>
              )}
            </View>
          )}
          <Separator />
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <View style={styles.imageBorder}>
                <Image
                  source={
                    sunscreen.image_uri
                      ? { uri: sunscreen.image_uri }
                      : require('../assets/images/placeholder.jpg')
                  }
                  style={styles.image}
                />
              </View>
            </View>
            <View style={styles.imageContainer}>
              <View style={styles.imageBorder}>
                <Image
                  source={
                    sunscreen.image_uri
                      ? { uri: sunscreen.image_uri }
                      : require('../assets/images/placeholder.jpg')
                  }
                  style={styles.image}
                />
              </View>
            </View>
          </View>
          <Separator />
          <View style={styles.infoSection}>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>SPF</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <Text style={styles.infoValue}>{sunscreen.spf}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Duration</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <Text style={styles.infoValue}>{formatDuration(sunscreen.duration)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Water Resistant</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <Text style={styles.infoValue}>
                  {sunscreen.water_duration
                    ? formatDuration(sunscreen.water_duration)
                    : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Type</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <Text style={styles.infoValue}>Lotion</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Form</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <Text style={styles.infoValue}>Lotion</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Coverage</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <Text style={styles.infoValue}>Lotion</Text>
              </View>
            </View>
          </View>
          <View style={[styles.notes, styles.infoRow]}>
            <Text style={styles.infoKey}>Notes</Text>
            <Separator gradient={INFO_SEPARATOR_GRADIENT} />
            <Text style={styles.infoValue}>
              {sunscreen.notes ? sunscreen.notes : 'N/A'}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ErrorScreen />
      )}
      {sunscreen?.barcode && (
        <View style={[styles.footer, { paddingBlockEnd: insets.bottom }]}>
          <Separator />
          <Text style={[styles.barcode, styles.headerText, styles.headerSunscreen]}>
            {sunscreen.barcode}
          </Text>
        </View>
      )}
    </View>
  )
}

export default editUserSunscreen

const styles = ScaledSheet.create({
  editUserSunscreen: {
    flex: 1,
    backgroundColor: MAIN_BACKGROUND,
  },

  header: {
    width: '100%',
    paddingInline: '3%',
    paddingBlockEnd: '12@s',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },

  headerItem: {
    width: '30%',
  },

  headerText: {
    fontSize: '16@ms',
    color: PROFILE_TEXT,
  },

  headerSunscreen: {
    fontWeight: 600,
    textAlign: 'center',
  },

  nameSection: {
    paddingInline: '3%',
    paddingBlock: '10@s',
    gap: '4@s',
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '5@s',
  },

  nameText: {
    flex: 1,
    fontSize: '26@ms',
    color: PROFILE_TEXT,
    fontWeight: 600,
  },

  subNameText: {
    fontSize: '16@ms',
    fontWeight: 500,
    color: PROFILE_ICON,
  },

  by: {
    fontSize: '14@ms',
    fontWeight: 400,
  },

  subNameSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 3,
    rowGap: 0,
  },

  imageSection: {
    paddingInline: '3%',
    paddingBlock: '15@s',
    flexDirection: 'row',
    gap: '10@s',
  },

  imageContainer: {
    flex: 1,
  },

  imageBorder: {
    width: '135@s',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: '2@s',
    borderColor: '#fff',
    borderRadius: 25,
  },

  image: {
    width: '125@s',
    backgroundColor: PROFILE_TEXT,
    aspectRatio: 1,
    borderRadius: 20,
  },

  infoSection: {
    paddingInline: '3%',
    paddingBlock: '10@s',
    flexDirection: 'row',
  },

  infoColumn: {
    flex: 1,
    gap: '10@s',
  },

  infoRow: {
    gap: '4@s',
  },

  infoKey: {
    fontSize: '16@ms',
    fontWeight: 600,
    color: PROFILE_TEXT,
  },

  infoValue: {
    fontSize: '16@ms',
    fontWeight: 500,
    color: PROFILE_ICON,
  },

  notes: {
    paddingInline: '3%',
    paddingBlockEnd: '10@s',
  },

  footer: {
    bottom: 0,
    backgroundColor: MAIN_BACKGROUND,
  },

  barcode: {
    paddingInline: '3%',
    paddingBlockStart: '10@s',
    alignSelf: 'center',
  },
})


{
  /* <View style={[styles.headerItem, { alignItems: 'flex-start' }]}>
              <Pressable onPress={cancelEdit} hitSlop={10}>
                <Text style={[styles.headerText, styles.cancel]}>Cancel</Text>
              </Pressable>
            </View> */
  //           cancel: {
  //   color: PROFILE_ICON,
  // },
}
