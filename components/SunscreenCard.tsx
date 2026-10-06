import { useUserSunscreens } from '@/context/UserSunscreenContext'
import {
  FONT_HEADER,
  FONT_SUBTEXT,
  FONT_TEXT,
  MAIN_BACKGROUND,
  MAIN_BG_DARK,
  MODAL_BG,
  MODAL_BUTTONS,
  PLACEHOLDER_BG,
  PROFILE_ICON,
  PROFILE_TEXT,
  SEPARATOR,
  SEPARATOR_BRIGHT,
  SUN_COLOR,
  WATER_COLOR
} from '@/lib/constants'
import { formatDuration, UserSunscreen } from '@/lib/userSunscreen'
import { Ionicons } from '@expo/vector-icons'
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { memo, useCallback, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ms, ScaledSheet } from 'react-native-size-matters'
import BorderButton from './BorderButton'
import ImageViewer from './ImageViewer'
import Separator from './Separator'

interface SunscreenCardProps {
  sunscreen: UserSunscreen
  isFocused: boolean
}

const SunscreenCard = memo(({ sunscreen, isFocused }: SunscreenCardProps) => {
  const insets = useSafeAreaInsets()
  const { toggleFavorite, archiveUserSunscreen } = useUserSunscreens()

  const [isWaterApplication, setIsWaterApplication] = useState(false)
  const [isImageFocused, setIsImageFocused] = useState(false)
  const isFavorite = sunscreen.is_favorite === 1

  const applySunscreen = async () => {}

  const imageSource = sunscreen.cover_uri ? sunscreen.cover_uri : sunscreen.image_uri

  const optionSheetRef = useRef<BottomSheetModal>(null)

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    []
  )

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isFocused ? MAIN_BACKGROUND : undefined,
        },
      ]}
    >
      <Pressable
        style={[
          styles.imageBorder,
          {
            borderColor: sunscreen.cover_border_color
              ? sunscreen.cover_border_color
              : sunscreen.border_color
                ? sunscreen.border_color
                : PLACEHOLDER_BG,
          },
        ]}
        onPress={() => setIsImageFocused(true)}
      >
        <Image
          source={imageSource ? imageSource : require('../assets/images/placeholder.jpg')}
          style={styles.image}
        />
      </Pressable>
      <View style={styles.infoSection}>
        <View style={styles.headerSection}>
          <Pressable
            style={styles.nameButton}
            onPress={() =>
              router.push({
                pathname: '/viewUserSunscreen',
                params: { id: sunscreen.id },
              })
            }
            hitSlop={4}
          >
            <Text style={styles.nameText} numberOfLines={1}>
              {sunscreen.nickname !== null ? sunscreen.nickname : sunscreen.name}
            </Text>
          </Pressable>
          <View style={styles.badgeSection}>
            <Pressable onPress={() => toggleFavorite(sunscreen.id)} hitSlop={4}>
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={ms(20)}
                color={isFavorite ? '#ffed4c' : PROFILE_ICON}
              />
            </Pressable>
            <Pressable onPress={() => optionSheetRef.current?.present()} hitSlop={4}>
              <Ionicons
                name="ellipsis-vertical-outline"
                size={ms(20)}
                color={PROFILE_ICON}
              />
            </Pressable>
          </View>
        </View>
        <View style={styles.seperator} />
        <View style={styles.bodySection}>
          <View style={styles.pinSection}>
            <Text style={styles.pinText}>SPF {sunscreen.spf}</Text>
            <View style={styles.pinSeparator} />
            <Text
              style={[
                styles.pinText,
                {
                  opacity: !isWaterApplication ? 1 : 0.4,
                },
              ]}
            >
              {formatDuration(sunscreen.duration)}
            </Text>
            <View style={styles.pinSeparator} />
            <Text
              style={[
                styles.pinText,
                {
                  opacity:
                    isWaterApplication || sunscreen.water_duration === null ? 1 : 0.4,
                },
              ]}
            >
              {sunscreen.water_duration
                ? formatDuration(sunscreen.water_duration)
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.buttonSection}>
            <BorderButton
              style={[styles.button, styles.toggleButton]}
              onPress={() => {
                if (sunscreen.water_duration !== null)
                  setIsWaterApplication(!isWaterApplication)
              }}
              borderStyle={2}
              borderRadius={12}
            >
              {sunscreen.water_duration ? (
                <>
                  <Ionicons
                    name="sunny-outline"
                    size={ms(18)}
                    style={{
                      opacity: !isWaterApplication ? 1 : 0.4,
                    }}
                    color={!isWaterApplication ? SUN_COLOR : PROFILE_TEXT}
                  />
                  <View
                    style={[
                      styles.toggleDivider,
                      { opacity: sunscreen.water_duration !== null ? 1 : 0.4 },
                    ]}
                  />
                  <Ionicons
                    name="water-outline"
                    size={ms(18)}
                    style={{
                      opacity: isWaterApplication ? 1 : 0.4,
                    }}
                    color={isWaterApplication ? WATER_COLOR : PROFILE_TEXT}
                  />
                </>
              ) : (
                <Ionicons name="sunny-outline" size={ms(18)} color={SUN_COLOR} />
              )}
            </BorderButton>
            <BorderButton
              style={[styles.button, styles.applyButton]}
              borderRadius={12}
              borderStyle={2}
              onPress={applySunscreen}
            >
              <Text style={styles.applyText}>Apply</Text>
            </BorderButton>
          </View>
        </View>
      </View>
      <ImageViewer
        isFocused={isImageFocused}
        setIsFocused={setIsImageFocused}
        source={imageSource}
      />
      <BottomSheetModal
        ref={optionSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.optionSheetBackground}
        handleIndicatorStyle={styles.optionSheetHandle}
      >
        <BottomSheetView
          style={[
            styles.optionButtonSection,
            {
              paddingBlockStart: 5,
              paddingBlockEnd: insets.bottom,
            },
          ]}
        >
          <View style={styles.sunscreenOptionSunscreen}>
            <Pressable
              style={styles.sunscreenOption}
              onPress={() => {
                router.push({
                  pathname: '/viewUserSunscreen',
                  params: { id: sunscreen.id },
                })
                optionSheetRef.current?.dismiss()
              }}
            >
              <Text style={styles.optionText}>More Info</Text>
            </Pressable>
            <Separator />
            <Pressable style={styles.sunscreenOption}>
              <Text style={styles.optionText}>Activity</Text>
            </Pressable>
          </View>
          <View style={styles.sunscreenOptionSunscreen}>
            <Pressable style={styles.sunscreenOption}>
              <Text style={styles.optionText}>Duplicate</Text>
            </Pressable>
            <Separator />
            <Pressable
              style={styles.sunscreenOption}
              onPress={() => {
                router.push({
                  pathname: '/editUserSunscreen',
                  params: { id: sunscreen.id },
                })
                optionSheetRef.current?.dismiss()
              }}
            >
              <Text style={styles.optionText}>Edit</Text>
            </Pressable>
            <Separator />
            <Pressable
              style={styles.sunscreenOption}
              onPress={() => {
                archiveUserSunscreen(sunscreen.id)
                optionSheetRef.current?.dismiss()
              }}
            >
              <Text style={styles.optionText}>Delete</Text>
            </Pressable>
          </View>
          <Pressable
            style={[styles.option, styles.optionCancel]}
            onPress={() => optionSheetRef.current?.dismiss()}
          >
            <Text style={styles.optionText}>Cancel</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  )
})

export default SunscreenCard

const styles = ScaledSheet.create({
  card: {
    flexDirection: 'row',
    gap: '10@s',
    paddingBlock: '5@s',
  },

  imageBorder: {
    marginInlineStart: '10@s',
    width: '90@s',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: '1.8@s',
  },

  image: {
    width: '83.6@s',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },

  infoSection: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginInlineEnd: '10@s',
  },

  nameButton: {
    flex: 1,
    marginInlineEnd: '5@s',
  },

  nameText: {
    fontSize: `${FONT_HEADER}@ms`,
    color: PROFILE_TEXT,
    fontWeight: 600,
  },

  badgeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@ms',
    paddingInlineStart: '6@ms',
  },

  seperator: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginBlock: '5@s',
    backgroundColor: SEPARATOR,
    marginInlineEnd: '-3%',
  },

  bodySection: {
    flex: 1,
    marginInlineEnd: '10@s',
    gap: '10@s',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  pinSection: {
    width: '95@ms',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  pinText: {
    fontSize: `${FONT_SUBTEXT}@ms`,
    fontWeight: 500,
    color: SEPARATOR_BRIGHT,
  },

  pinSeparator: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    backgroundColor: SEPARATOR,
  },

  buttonSection: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  button: {
    height: '47%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingInline: '10@s',
    backgroundColor: MAIN_BG_DARK,
  },

  toggleButton: {
    justifyContent: 'space-evenly',
    gap: '10@s',
  },

  applyButton: {
    justifyContent: 'center',
  },

  toggleDivider: {
    width: 1.5,
    height: '60%',
    backgroundColor: '#1f1f1f',
  },

  applyText: {
    fontSize: `${FONT_SUBTEXT}@ms`,
    fontWeight: 600,
    textAlign: 'center',
    color: SEPARATOR_BRIGHT,
  },

  option: {},

  optionSheetBackground: {
    backgroundColor: MODAL_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  optionSheetHandle: {
    width: '11%',
    height: '2@s',
    backgroundColor: PROFILE_TEXT,
  },

  optionButtonSection: {
    backgroundColor: MODAL_BG,
    gap: '10@s',
  },

  sunscreenOptionSunscreen: {
    marginInline: '3%',
    backgroundColor: MODAL_BUTTONS,
    borderRadius: 12,
  },

  sunscreenOption: {
    paddingBlock: '12@s',
  },

  optionCancel: {
    marginInline: '3%',
    paddingBlock: '12@s',
    backgroundColor: MODAL_BUTTONS,
    borderRadius: 12,
  },

  optionText: {
    fontSize: '15@ms',
    fontWeight: 500,
    color: PROFILE_TEXT,
    width: '100%',
    textAlign: 'center',
  },
})
