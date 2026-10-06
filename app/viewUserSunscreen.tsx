import ErrorScreen from '@/components/ErrorScreen'
import ImageViewer from '@/components/ImageViewer'
import Separator from '@/components/Separator'
import { useUserSunscreens } from '@/context/UserSunscreenContext'
import {
  FONT_HEADER,
  FONT_TEXT,
  FONT_TITLE,
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
import { useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ms, ScaledSheet } from 'react-native-size-matters'

const INFO_SEPARATOR_GRADIENT = {
  colors: [SEPARATOR, SEPARATOR, MAIN_BACKGROUND],
  locations: [0, 0.7, 1],
} as const

const SECTION_GAP = 10
const ITEM_GAP = 4

const PLACEHOLDER_IMAGE = require('../assets/images/placeholder.jpg')

const ViewUserSunscreen = () => {
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()
  const sunscreenId = Number(id)
  const { getById, toggleFavorite } = useUserSunscreens()

  const [focusImageSource, setFocuseImageSource] = useState<string | null>(null)
  const [isImageFocused, setIsImageFocused] = useState(false)

  const sunscreen = getById(sunscreenId)
  const isFavorite = sunscreen?.is_favorite === 1

  const returnBack = useCallback(() => {
    router.back()
  }, [])

  const editSunscreen = useCallback(() => {
    router.push({ pathname: '/editUserSunscreen', params: { id } })
  }, [id])

  const focuseImage = useCallback(
    (type: ImageType) => {
      if (type == 'cover' && sunscreen) setFocuseImageSource(sunscreen.cover_uri)
      else if (sunscreen) setFocuseImageSource(sunscreen.image_uri)

      setIsImageFocused(true)
    },
    [sunscreen]
  )

  const favoriteButton = (
    <Pressable onPress={() => toggleFavorite(sunscreenId)} hitSlop={5}>
      <Ionicons
        name={isFavorite ? 'star' : 'star-outline'}
        size={ms(FONT_TITLE + 3)}
        color={isFavorite ? '#ffed4c' : PROFILE_ICON}
      />
    </Pressable>
  )

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
              size={ms(FONT_HEADER + 7)}
              color={PROFILE_ICON}
              style={{ transform: [{ translateY: ms(3) }] }}
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
          {sunscreen.nickname === null || sunscreen.name === null ? (
            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>
                  {sunscreen.name
                    ? sunscreen.name
                    : sunscreen.nickname
                      ? sunscreen.nickname
                      : '[ERROR]'}
                </Text>
                {favoriteButton}
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
                {favoriteButton}
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
                    sunscreen.cover_uri ? { uri: sunscreen.cover_uri } : PLACEHOLDER_IMAGE
                  }
                  style={styles.image}
                />
              </Pressable>
            </View>
            <View style={styles.imageContainer}>
              <Text style={[styles.infoKey, styles.imageHeaderText]}>Product</Text>
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
                    sunscreen.image_uri ? { uri: sunscreen.image_uri } : PLACEHOLDER_IMAGE
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
          <Text style={[styles.barcode, styles.infoKey]}>{sunscreen.barcode}</Text>
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
    paddingBlockEnd: `${SECTION_GAP}@s`,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },

  headerItem: {
    width: '30%',
  },

  headerText: {
    fontSize: `${FONT_HEADER}@ms`,
    color: PROFILE_TEXT,
  },

  headerSunscreen: {
    fontSize: `${FONT_HEADER}@ms`,
    fontWeight: 600,
    textAlign: 'center',
  },

  nameSection: {
    paddingInline: '3%',
    paddingBlock: `${SECTION_GAP}@s`,
    gap: `${ITEM_GAP + 1}@s`,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: `${SECTION_GAP}@s`,
  },

  nameText: {
    flex: 1,
    fontSize: `${FONT_TITLE}@ms`,
    color: PROFILE_TEXT,
    fontWeight: 600,
  },

  subNameText: {
    fontSize: `${FONT_TEXT}@ms`,
    fontWeight: 500,
    color: PROFILE_ICON,
  },

  by: {
    fontSize: `${FONT_TEXT}@ms`,
    fontWeight: 400,
    opacity: 0.77,
  },

  subNameSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: '3@ms',
    rowGap: 0,
  },

  imageSection: {
    paddingInline: '6%',
    paddingBlockStart: `${SECTION_GAP}@s`,
    paddingBlockEnd: `${SECTION_GAP + 2.5}@s`,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  imageContainer: {
    gap: `${ITEM_GAP}@s`,
  },

  imageHeaderText: {
    textAlign: 'center',
  },

  imageBorder: {
    width: '111@s',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: '2@s',
    borderRadius: 30,
  },

  image: {
    width: '102.9@s',
    aspectRatio: 1,
    borderRadius: 25,
  },

  infoSection: {
    paddingInline: '3%',
    paddingBlock: `${SECTION_GAP}@s`,
    flexDirection: 'row',
  },

  infoColumn: {
    flex: 1,
    gap: `${SECTION_GAP}@s`,
  },

  infoRow: {
    gap: `${ITEM_GAP}@s`,
  },

  infoKey: {
    fontSize: `${FONT_TEXT}@ms`,
    fontWeight: 500,
    color: PROFILE_TEXT,
  },

  infoValue: {
    fontSize: `${FONT_TEXT}@ms`,
    fontWeight: 400,
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
