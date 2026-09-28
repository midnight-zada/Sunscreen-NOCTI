import ErrorScreen from '@/components/ErrorScreen'
import ImageViewer from '@/components/ImageViewer'
import Separator from '@/components/Separator'
import { useUserSunscreens } from '@/context/UserSunscreenContext'
import {
  MAIN_BACKGROUND,
  PLACEHOLDER_BG,
  PROFILE_ICON,
  PROFILE_TEXT,
  SEPARATOR,
} from '@/lib/constants'
import { formatDuration, ImageType } from '@/lib/userSunscreen'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ms, ScaledSheet } from 'react-native-size-matters'

const INFO_SEPARATOR_GRADIENT = {
  colors: [SEPARATOR, SEPARATOR, MAIN_BACKGROUND],
  locations: [0, 0.7, 1],
} as const

const IMAGE_HEADER_GRADIENT = {
  colors: [MAIN_BACKGROUND, SEPARATOR, SEPARATOR, MAIN_BACKGROUND],
  locations: [0, 0.15, 0.85, 1],
} as const

const ViewUserSunscreen = () => {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const sunscreenId = Number(id)
  const { getById, toggleFavorite } = useUserSunscreens()

  const [focusImageSource, setFocuseImageSource] = useState<string | null>(null)
  const [isImageFocused, setIsImageFocused] = useState(false)

  const sunscreen = getById(sunscreenId)
  const isFavorite = sunscreen?.is_favorite === 1

  const returnBack = () => {
    router.back()
  }

  const editSunscreen = () => {
    router.push({ pathname: '/editUserSunscreen', params: { id } })
  }

  const focuseImage = (type: ImageType) => {
    if (type == 'cover' && sunscreen) setFocuseImageSource(sunscreen.cover_uri)
    else if (sunscreen) setFocuseImageSource(sunscreen.image_uri)

    setIsImageFocused(true)
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
          <Pressable onPress={returnBack} hitSlop={10}>
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
              <Text style={[styles.infoKey, styles.imageHeaderText]}>Cover</Text>
              <Separator gradient={IMAGE_HEADER_GRADIENT} scaleMargin={[3, 5]} />
              <Pressable
                style={[
                  styles.imageBorder,
                  {
                    borderColor: sunscreen.cover_border_color
                      ? sunscreen.cover_border_color
                      : PLACEHOLDER_BG,
                  },
                ]}
                onPress={() => focuseImage('cover')}
              >
                <Image
                  source={
                    sunscreen.cover_uri
                      ? { uri: sunscreen.cover_uri }
                      : require('../assets/images/placeholder.jpg')
                  }
                  style={styles.image}
                />
              </Pressable>
            </View>
            <View style={styles.imageContainer}>
              <Text style={[styles.infoKey, styles.imageHeaderText]}>Product</Text>
              <Separator gradient={IMAGE_HEADER_GRADIENT} scaleMargin={[3, 5]} />
              <Pressable
                style={[
                  styles.imageBorder,
                  {
                    borderColor: sunscreen.border_color
                      ? sunscreen.border_color
                      : PLACEHOLDER_BG,
                  },
                ]}
                onPress={() => focuseImage('product')}
              >
                <Image
                  source={
                    sunscreen.image_uri
                      ? { uri: sunscreen.image_uri }
                      : require('../assets/images/placeholder.jpg')
                  }
                  style={styles.image}
                />
              </Pressable>
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
                <Text style={styles.infoValue}>
                  {sunscreen.type ? sunscreen.type : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Form</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <Text style={styles.infoValue}>
                  {sunscreen.form ? sunscreen.form : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Coverage</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <Text style={styles.infoValue}>
                  {sunscreen.coverage ? sunscreen.coverage : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.notes, styles.infoRow]}>
            <Text style={styles.infoKey}>Notes</Text>
            <Separator gradient={INFO_SEPARATOR_GRADIENT} />
            <Text style={styles.infoValue}>{sunscreen?.notes}</Text>
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
      <ImageViewer
        isFocused={isImageFocused}
        setIsFocused={setIsImageFocused}
        source={focusImageSource}
      />
    </View>
  )
}

export default ViewUserSunscreen

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
    paddingBlockStart: '10@s',
    paddingBlockEnd: '14@s',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: '10@s',
  },

  imageContainer: {},

  imageHeaderText: {
    textAlign: 'center',
  },

  imageBorder: {
    width: '136@s',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: '2@s',
    borderRadius: 32,
  },

  image: {
    width: '126@s',
    aspectRatio: 1,
    borderRadius: 27,
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
