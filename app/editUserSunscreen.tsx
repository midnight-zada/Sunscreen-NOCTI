import DropInput from '@/components/DropInput'
import ErrorScreen from '@/components/ErrorScreen'
import ImageViewer from '@/components/ImageViewer'
import LoadingDots from '@/components/LoadingDots'
import Separator from '@/components/Separator'
import { ERROR_RED } from '@/constants/colors'
import { useAppContext } from '@/context/AppContext'
import { useUserSunscreens } from '@/context/UserSunscreenContext'
import {
  FONT_HEADER,
  FONT_TEXT,
  MAIN_BACKGROUND,
  PLACEHOLDER_BG,
  PROFILE_ICON,
  PROFILE_TEXT,
  SEPARATOR,
} from '@/lib/constants'
import {
  commitUserSunscreenImage,
  COVERAGE_OPTIONS,
  discardCommittedUserSunscreenImage,
  discardStagedUserSunscreenImage,
  editUserSunscreen,
  FORM_OPTIONS,
  ImageType,
  InsertUserSunscreen,
  insertUserSunscreen,
  pickUserSunscreenImage,
  takeUserSunscreenPhoto,
  TYPE_OPTIONS,
} from '@/lib/userSunscreen'

import { Ionicons } from '@expo/vector-icons'
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Keyboard, Pressable, Text, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { moderateScale, ms, scale, ScaledSheet } from 'react-native-size-matters'

const INFO_SEPARATOR_GRADIENT = {
  colors: [SEPARATOR, SEPARATOR, MAIN_BACKGROUND],
  locations: [0, 0.7, 1],
} as const

const PLACEHOLDER_COLOR = PROFILE_ICON
const SECTION_GAP = 8
const ITEM_GAP = 4
const SINGLE_GAP = 6

const SET_RADIUS = 3

const EMPTY_SUNSCREEN: InsertUserSunscreen = {
  user_id: '',
  sunscreen_id: null,
  nickname: null,
  is_favorite: 0,
  notes: null,
  cover_uri: null,
  cover_border_color: null,
  image_uri: null,
  border_color: null,
  name: null,
  brand: null,
  spf: 0,
  type: null,
  form: null,
  coverage: null,
  duration: 0,
  water_duration: null,
  barcode: null,
}

const PLACEHOLDER_IMAGE = require('../assets/images/placeholder.jpg')

type EditSheetMode = 'color' | 'picture' | null
type EditUserSunscreenMode = 'create' | 'edit'

const getFieldErrors = (sunscreen: InsertUserSunscreen) => {
  const errors: string[] = []

  if (!sunscreen.name && !sunscreen.nickname) {
    errors.push('- Fill in either nickname or name')
  }

  if (!sunscreen.spf || sunscreen.spf <= 0) {
    errors.push('- SPF must be greater than 0')
  }

  if (!sunscreen.duration || sunscreen.duration <= 0) {
    errors.push('- Duration must be greater than 0')
  }

  return errors
}

const EditUserSunscreen = () => {
  const insets = useSafeAreaInsets()
  const { db, userId } = useAppContext()
  const { archiveUserSunscreen, duplicateSunscreen } = useUserSunscreens()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getById, refreshUserSunscreens } = useUserSunscreens()

  const [editSunscreen, setEditSunscreen] = useState<InsertUserSunscreen | null>(null)
  const [sheetMode, setSheetMode] = useState<EditSheetMode>(null)
  const [imageType, setImageType] = useState<ImageType | null>(null)
  const [isWaitingLibrary, setIsWaitingLibrary] = useState(false)
  const [isWaitingPhoto, setIsWaitingPhoto] = useState(false)

  const sunscreenId = Number(id)
  const sunscreen = getById(sunscreenId)
  const mode: EditUserSunscreenMode = sunscreenId === -1 ? 'create' : 'edit'

  const editSheetRef = useRef<BottomSheetModal>(null)
  const stagedImages = useRef<Partial<Record<ImageType, string>>>({})
  const removedImages = useRef<Set<ImageType>>(new Set())

  const [focusImageSource, setFocuseImageSource] = useState<string | null>(null)
  const [isImageFocused, setIsImageFocused] = useState(false)

  const isComfirming = useRef(false)
  const isDuplicating = useRef(false)

  const discardAllStagedImages = useCallback(() => {
    for (const uri of Object.values(stagedImages.current)) {
      if (uri) discardStagedUserSunscreenImage(uri)
    }
    stagedImages.current = {}
  }, [])

  useEffect(() => {
    return () => discardAllStagedImages()
  }, [discardAllStagedImages])

  const setEditSunscreenField = useCallback(
    <Key extends keyof InsertUserSunscreen>(key: Key, value: InsertUserSunscreen[Key]) =>
      setEditSunscreen((prev) => (prev ? { ...prev, [key]: value } : prev)),
    []
  )

  useEffect(() => {
    if (editSunscreen) return

    if (mode === 'create') {
      setEditSunscreen({ ...EMPTY_SUNSCREEN, user_id: userId })
      return
    }

    if (!sunscreen) return

    const { id, is_archived, created_at, updated_at, synced_at, ...insertSunscreen } =
      sunscreen
    setEditSunscreen(insertSunscreen)
  }, [sunscreen, mode, userId, editSunscreen])

  const cancelEdit = useCallback(() => {
    discardAllStagedImages()
    router.back()
  }, [discardAllStagedImages])

  const confirmEdit = useCallback(async () => {
    if (isComfirming.current) return
    isComfirming.current = true

    try {
      if (editSunscreen) {
        let confirmEditSunscreen = editSunscreen

        const fieldErrors = getFieldErrors(confirmEditSunscreen)

        if (fieldErrors.length > 0) {
          await notificationAsync(NotificationFeedbackType.Error)
          Alert.alert('Invalid Input(s)', fieldErrors.join('\n'))
          return
        }

        const targetId =
          mode === 'create'
            ? await insertUserSunscreen(db, {
                ...confirmEditSunscreen,
                cover_uri: null,
                image_uri: null,
              })
            : sunscreenId

        let hasImageUpdates = false

        for (const [type, stagedURI] of Object.entries(stagedImages.current) as [
          ImageType,
          string,
        ][]) {
          const commitURI = await commitUserSunscreenImage(targetId, stagedURI, type)

          confirmEditSunscreen =
            type === 'cover'
              ? { ...confirmEditSunscreen, cover_uri: commitURI }
              : { ...confirmEditSunscreen, image_uri: commitURI }
          hasImageUpdates = true
        }

        if (mode === 'edit') {
          for (const type of removedImages.current) {
            if (!stagedImages.current[type])
              discardCommittedUserSunscreenImage(sunscreenId, type)
          }
        }

        stagedImages.current = {}
        removedImages.current = new Set()

        if (mode === 'edit' || hasImageUpdates)
          await editUserSunscreen(db, targetId, confirmEditSunscreen)

        await refreshUserSunscreens()
        await notificationAsync(NotificationFeedbackType.Success)
        router.back()
      } else {
        await notificationAsync(NotificationFeedbackType.Error)
      }
    } catch (error) {
      await notificationAsync(NotificationFeedbackType.Error)
      console.error(
        `Failed To Confirm Edit: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      isComfirming.current = false
    }
  }, [editSunscreen, db, sunscreenId, mode, refreshUserSunscreens])

  const focuseImage = useCallback(
    (type: ImageType) => {
      if (type == 'cover' && editSunscreen) setFocuseImageSource(editSunscreen?.cover_uri)
      else if (editSunscreen) setFocuseImageSource(editSunscreen?.image_uri)

      setIsImageFocused(true)
    },
    [editSunscreen]
  )

  const editProductImage = useCallback(async () => {
    Keyboard.dismiss()
    setSheetMode('picture')
    setImageType('product')
    editSheetRef.current?.present()
  }, [])

  const editCoverImage = useCallback(async () => {
    Keyboard.dismiss()
    setSheetMode('picture')
    setImageType('cover')
    editSheetRef.current?.present()
  }, [])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    []
  )

  const stageImageResults = useCallback(
    (imageResult: [string, string | null] | null, type: ImageType) => {
      setIsWaitingLibrary(false)
      setIsWaitingPhoto(false)

      if (!imageResult) return
      const [uri, borderColor] = imageResult

      const prevStagedImage = stagedImages.current[type]
      if (prevStagedImage) discardStagedUserSunscreenImage(prevStagedImage)
      stagedImages.current = { ...stagedImages.current, [type]: uri }
      removedImages.current.delete(type)

      if (type === 'cover') {
        setEditSunscreenField('cover_uri', uri)
        setEditSunscreenField('cover_border_color', borderColor)
      } else {
        setEditSunscreenField('image_uri', uri)
        setEditSunscreenField('border_color', borderColor)
      }

      editSheetRef.current?.close()
    },
    [setEditSunscreenField]
  )

  const uploadImage = useCallback(async () => {
    if (!imageType) return

    try {
      setIsWaitingLibrary(true)
      stageImageResults(await pickUserSunscreenImage(imageType), imageType)
    } catch (error) {
      setIsWaitingLibrary(false)
      await notificationAsync(NotificationFeedbackType.Error)
      console.log(
        `Error Picking Image: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }, [imageType, stageImageResults])

  const takeImage = useCallback(async () => {
    if (!imageType) return

    try {
      setIsWaitingPhoto(true)
      stageImageResults(await takeUserSunscreenPhoto(imageType), imageType)
    } catch (error) {
      setIsWaitingPhoto(false)
      await notificationAsync(NotificationFeedbackType.Error)
      console.log(
        `Error Taking Photo: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }, [imageType, stageImageResults])

  const removeImage = useCallback(async () => {
    if (!imageType) return

    const stagedURI = stagedImages.current[imageType]

    if (stagedURI) {
      discardStagedUserSunscreenImage(stagedURI)
      delete stagedImages.current[imageType]
    }

    removedImages.current.add(imageType)

    if (imageType === 'cover') {
      setEditSunscreenField('cover_uri', null)
      setEditSunscreenField('cover_border_color', null)
    } else {
      setEditSunscreenField('image_uri', null)
      setEditSunscreenField('border_color', null)
    }

    editSheetRef.current?.close()
  }, [imageType, setEditSunscreenField])

  const onDuplicateSunscreen = async () => {
    if (isDuplicating.current) return
    isDuplicating.current = true

    try {
      if (!editSunscreen) return
      const dupeId = await duplicateSunscreen(editSunscreen)
      router.back()
      notificationAsync(NotificationFeedbackType.Success)
      console.log(
        `Duplicated Sunscreen [${editSunscreen.nickname ? editSunscreen.nickname : editSunscreen.name}] to Sunscreen [${dupeId}]`
      )
    } catch (error) {
      Alert.alert(
        'Something Went Wrong',
        `${error instanceof Error ? error.message : String(error)}`
      )
      notificationAsync(NotificationFeedbackType.Error)
      console.error(
        `Failed To Duplicate: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      isDuplicating.current = false
    }
  }

  const deleteSunscreen = () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this sunscreen?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveUserSunscreen(sunscreenId)
            router.back()
            notificationAsync(NotificationFeedbackType.Success)
            console.log(`Deleted Sunscreen ID: ${sunscreenId}`)
          } catch (error) {
            Alert.alert(
              'Something Went Wrong',
              `${error instanceof Error ? error.message : String(error)}`
            )
            notificationAsync(NotificationFeedbackType.Error)
            console.error(
              `Failed To Delete: ${error instanceof Error ? error.message : String(error)}`
            )
          }
        },
      },
    ])
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
      <StatusBar style="light" />
      <View style={styles.header}>
        <View
          style={[styles.headerItem, { alignItems: 'baseline', flexDirection: 'row' }]}
        >
          <Pressable onPress={cancelEdit} hitSlop={10}>
            <Text style={[styles.headerText, styles.cancel]}>Cancel</Text>
          </Pressable>
          <Ionicons
            name="chevron-back"
            size={ms(FONT_HEADER + 7)}
            color={PROFILE_ICON}
            style={{ opacity: 0 }}
            pointerEvents="none"
          />
        </View>
        <View style={styles.headerItem}>
          <Text style={[styles.headerText, styles.headerSunscreen]}>Sunscreen</Text>
        </View>
        <View style={[styles.headerItem, { alignItems: 'flex-end' }]}>
          <Pressable onPress={confirmEdit} hitSlop={10}>
            <Text style={styles.headerText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
      <Separator />
      {editSunscreen ? (
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          bottomOffset={20}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.nameInputSection}>
            <View style={styles.horizInfoRow}>
              <Text
                style={[
                  styles.infoKey,
                  styles.horizKey,
                  !editSunscreen.nickname && !editSunscreen.name && styles.inputNeeded,
                ]}
              >
                Nickname
              </Text>
              <TextInput
                style={[styles.noteInput, styles.horizInput]}
                value={editSunscreen.nickname || ''}
                onChange={(e) =>
                  setEditSunscreenField('nickname', e.nativeEvent.text || null)
                }
              />
            </View>
            <View style={styles.horizInfoRow}>
              <Text
                style={[
                  styles.infoKey,
                  styles.horizKey,
                  !editSunscreen.nickname && !editSunscreen.name && styles.inputNeeded,
                ]}
              >
                Name
              </Text>
              <TextInput
                style={[styles.noteInput, styles.horizInput]}
                value={editSunscreen.name || ''}
                onChange={(e) =>
                  setEditSunscreenField('name', e.nativeEvent.text || null)
                }
              />
            </View>
            <View style={styles.horizInfoRow}>
              <Text style={[styles.infoKey, styles.horizKey]}>Brand</Text>
              <TextInput
                style={[styles.noteInput, styles.horizInput]}
                value={editSunscreen.brand || ''}
                onChange={(e) => {
                  setEditSunscreenField('brand', e.nativeEvent.text || null)
                }}
              />
            </View>

            <View style={styles.setSection}>
              <Pressable style={styles.setButtons}>
                <View style={styles.setIndicator}>
                  <Ionicons name="pin" size={ms(FONT_TEXT + 3)} color={PROFILE_TEXT} />
                </View>
                <View style={styles.setTextSection}>
                  <Text style={[styles.infoKey, styles.setText]}>Pin</Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.setButtons}
                onPress={() =>
                  setEditSunscreenField(
                    'is_favorite',
                    editSunscreen.is_favorite === 0 ? 1 : 0
                  )
                }
              >
                <View style={styles.setIndicator}>
                  <Ionicons
                    name="star"
                    size={ms(FONT_TEXT + 3)}
                    color={
                      editSunscreen.is_favorite === 0 ? PROFILE_TEXT : 'rgb(255, 225, 0)'
                    }
                  />
                </View>
                <View style={styles.setTextSection}>
                  <Text style={[styles.infoKey, styles.setText]}>Favorite</Text>
                </View>
              </Pressable>
            </View>
          </View>
          <Separator />
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <Text style={[styles.infoKey, styles.imageHeaderText]}>Cover</Text>
              <Pressable
                style={[
                  styles.imageBorder,
                  {
                    borderColor: editSunscreen.cover_border_color
                      ? editSunscreen.cover_border_color
                      : PLACEHOLDER_BG,
                  },
                ]}
                onPress={() => focuseImage('cover')}
              >
                <Image
                  source={
                    editSunscreen.cover_uri
                      ? { uri: editSunscreen.cover_uri }
                      : PLACEHOLDER_IMAGE
                  }
                  style={styles.image}
                />
              </Pressable>
              <Pressable style={styles.editButton} onPress={editCoverImage}>
                <Text style={styles.editText}>Edit</Text>
                <Ionicons
                  name="create-outline"
                  size={ms(FONT_TEXT + 1)}
                  color={PROFILE_TEXT}
                />
              </Pressable>
            </View>
            <View style={styles.imageContainer}>
              <Text style={[styles.infoKey, styles.imageHeaderText]}>Product</Text>
              <Pressable
                style={[
                  styles.imageBorder,
                  {
                    borderColor: editSunscreen.border_color
                      ? editSunscreen.border_color
                      : PLACEHOLDER_BG,
                  },
                ]}
                onPress={() => focuseImage('product')}
              >
                <Image
                  source={
                    editSunscreen.image_uri
                      ? { uri: editSunscreen.image_uri }
                      : PLACEHOLDER_IMAGE
                  }
                  style={styles.image}
                />
              </Pressable>
              <Pressable style={styles.editButton} onPress={editProductImage}>
                <Text style={styles.editText}>Edit</Text>
                <Ionicons
                  name="create-outline"
                  size={ms(FONT_TEXT + 1)}
                  color={PROFILE_TEXT}
                />
              </Pressable>
            </View>
          </View>
          <Separator />
          <View style={styles.infoSection}>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text
                  style={[styles.infoKey, editSunscreen.spf <= 0 && styles.inputNeeded]}
                >
                  SPF
                </Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <TextInput
                  style={styles.infoValue}
                  value={editSunscreen.spf === 0 ? '' : String(editSunscreen.spf)}
                  onChange={(e) => {
                    const digits = e.nativeEvent.text.replace(/[^0-9]/g, '')
                    setEditSunscreenField('spf', digits === '' ? 0 : Number(digits))
                  }}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoKey,
                    editSunscreen.duration <= 0 && styles.inputNeeded,
                  ]}
                >
                  Duration
                </Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <TextInput
                  style={styles.infoValue}
                  value={
                    editSunscreen.duration === 0
                      ? ''
                      : String(Math.round(editSunscreen.duration / 60000))
                  }
                  onChange={(e) => {
                    const digits = e.nativeEvent.text.replace(/[^0-9]/g, '')
                    setEditSunscreenField(
                      'duration',
                      digits === '' ? 0 : Number(digits) * 60000
                    )
                  }}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Water Resistant</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <TextInput
                  style={styles.infoValue}
                  value={
                    editSunscreen.water_duration === 0 ||
                    editSunscreen.water_duration === null
                      ? ''
                      : String(Math.round(editSunscreen.water_duration / 60000))
                  }
                  onChange={(e) => {
                    const digits = e.nativeEvent.text.replace(/[^0-9]/g, '')
                    setEditSunscreenField(
                      'water_duration',
                      digits === '' ? null : Number(digits) * 60000
                    )
                  }}
                  placeholder="N/A"
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Type</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <DropInput
                  type="type"
                  data={TYPE_OPTIONS}
                  initValue={editSunscreen.type}
                  setField={setEditSunscreenField}
                  fontSize={FONT_TEXT}
                />
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Form</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <DropInput
                  type="form"
                  data={FORM_OPTIONS}
                  initValue={editSunscreen.form}
                  setField={setEditSunscreenField}
                  fontSize={FONT_TEXT}
                />
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Coverage</Text>
                <Separator gradient={INFO_SEPARATOR_GRADIENT} />
                <DropInput
                  type="coverage"
                  data={COVERAGE_OPTIONS}
                  initValue={editSunscreen.coverage}
                  setField={setEditSunscreenField}
                  fontSize={FONT_TEXT}
                />
              </View>
            </View>
          </View>
          <View style={styles.notes}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Notes</Text>
              <Separator gradient={INFO_SEPARATOR_GRADIENT} />
              <TextInput
                style={styles.noteInput}
                value={editSunscreen.notes || ''}
                onChange={(e) => setEditSunscreenField('notes', e.nativeEvent.text)}
                multiline
              />
            </View>
            <View style={styles.horizInfoRow}>
              <Text style={[styles.infoKey, { marginInlineEnd: scale(SECTION_GAP) }]}>
                Barcode
              </Text>
              <TextInput
                style={[styles.noteInput, styles.horizInput]}
                value={editSunscreen.barcode || ''}
                onChange={(e) => setEditSunscreenField('barcode', e.nativeEvent.text)}
              />
            </View>
          </View>
          {mode === 'edit' && (
            <>
              <Separator scaleMargin={SECTION_GAP} />
              <View style={styles.bottomButtonSection}>
                <Pressable
                  style={[styles.bottomButtons, { borderColor: PROFILE_ICON }]}
                  onPress={onDuplicateSunscreen}
                >
                  <Text
                    style={[styles.infoKey, styles.deleteText, { color: PROFILE_ICON }]}
                  >
                    Duplicate
                  </Text>
                </Pressable>
                <Pressable style={styles.bottomButtons} onPress={deleteSunscreen}>
                  <Text style={[styles.infoKey, styles.deleteText]}>Delete</Text>
                </Pressable>
              </View>
            </>
          )}
          <View style={{ height: insets.bottom }} />
        </KeyboardAwareScrollView>
      ) : (
        <ErrorScreen />
      )}
      <BottomSheetModal
        ref={editSheetRef}
        snapPoints={['60%']}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetView style={styles.sheetContent}>
          <View style={styles.modalHeader}>
            <Pressable
              style={[
                styles.modalHeaderOption,
                {
                  opacity: sheetMode === 'picture' ? 1 : 0.3,
                },
              ]}
              onPress={() => setSheetMode('picture')}
            >
              <Text style={styles.modalHeaderText}>Edit Picture</Text>
              <View style={styles.modalSeperator} />
            </Pressable>
            <Pressable
              style={[
                styles.modalHeaderOption,
                {
                  opacity: sheetMode === 'color' ? 1 : 0.3,
                },
              ]}
              onPress={() => setSheetMode('color')}
            >
              <Text style={styles.modalHeaderText}>Edit Color</Text>
              <View style={styles.modalSeperator} />
            </Pressable>
          </View>
          {sheetMode === 'picture' && (
            <View style={styles.modalPictureContainer}>
              <Pressable
                style={styles.modalPictureButton}
                onPress={uploadImage}
                disabled={isWaitingLibrary}
              >
                <Ionicons
                  name="images-outline"
                  size={moderateScale(25)}
                  style={styles.modalPictureIcon}
                />
                {isWaitingLibrary ? (
                  <LoadingDots size={scale(5)} />
                ) : (
                  <Text style={styles.modalPictureText}>Choose from library</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.modalPictureButton}
                onPress={takeImage}
                disabled={isWaitingPhoto}
              >
                <Ionicons
                  name="camera-outline"
                  size={moderateScale(25)}
                  style={styles.modalPictureIcon}
                />
                {isWaitingPhoto ? (
                  <LoadingDots size={scale(5)} />
                ) : (
                  <Text style={styles.modalPictureText}>Take photo</Text>
                )}
              </Pressable>
              <Pressable style={styles.modalPictureButton} onPress={removeImage}>
                <Ionicons
                  name="trash-outline"
                  size={moderateScale(25)}
                  style={[styles.modalPictureIcon, styles.modalPictureDelete]}
                />
                <Text style={[styles.modalPictureText, styles.modalPictureDelete]}>
                  Remove current image
                </Text>
              </Pressable>
            </View>
          )}
          {sheetMode === 'color' && (
            <View style={styles.modalColorContainer}>
              <Text style={styles.modalPictureText}>[Placeholder]</Text>
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
      <ImageViewer
        isFocused={isImageFocused}
        setIsFocused={setIsImageFocused}
        source={focusImageSource}
      />
    </View>
  )
}

export default EditUserSunscreen

const styles = ScaledSheet.create({
  editUserSunscreen: {
    flex: 1,
    backgroundColor: MAIN_BACKGROUND,
  },

  header: {
    width: '100%',
    paddingInline: '3%',
    paddingBlockEnd: `${10}@s`,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },

  headerItem: {
    width: '30%',
  },

  cancel: {
    color: PROFILE_ICON,
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

  nameInputSection: {
    paddingInline: '3%',
    paddingBlock: `${SECTION_GAP}@s`,
    gap: `${SINGLE_GAP}@s`,
  },

  horizInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  horizKey: {
    width: '90@s',
  },

  horizInput: {
    flex: 1,
  },

  setSection: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBlockStart: `${SECTION_GAP - SINGLE_GAP}@s`,
    gap: '10@s',
  },

  setButtons: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    paddingBlock: '2@s',
    paddingInlineStart: '8@s',
    paddingInlineEnd: '2@s',
    backgroundColor: '#5e6163',
    borderRadius: 3,
  },

  setIndicator: {
    alignItems: 'center',
  },

  setTextSection: {
    flex: 1,
    alignItems: 'center',
    paddingBlock: '4@s',
    backgroundColor: SEPARATOR,
    borderRadius: SET_RADIUS,
  },

  setText: {
    color: PROFILE_TEXT,
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

  editButton: {
    paddingBlock: '4@s',
    marginBlockStart: `${ITEM_GAP}@s`,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: '5@s',
    backgroundColor: SEPARATOR,
    borderRadius: 3,
  },

  editText: {
    fontSize: `${FONT_TEXT}@ms`,
    fontWeight: 500,
    color: PROFILE_TEXT,
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
    marginInlineEnd: `${ITEM_GAP}@s`,
    paddingInline: '5@s',
    paddingBlock: '4@s',
    fontSize: `${FONT_TEXT}@ms`,
    fontWeight: 400,
    color: PROFILE_ICON,
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 3,
  },

  inputNeeded: {
    color: '#e81f1f',
  },

  notes: {
    paddingInline: '3%',
    gap: `${SECTION_GAP}@s`,
  },

  noteInput: {
    paddingInline: '5@s',
    paddingBlock: '4@s',
    fontSize: `${FONT_TEXT}@ms`,
    fontWeight: 400,
    color: PROFILE_ICON,
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 3,
  },

  bottomButtonSection: {
    marginInline: '3%',
    flexDirection: 'row',
    gap: `${SECTION_GAP}@s`,
  },

  bottomButtons: {
    flex: 1,
    alignItems: 'center',
    paddingBlock: '7@s',
    borderWidth: '1.5@s',
    borderColor: ERROR_RED,
    borderRadius: '3@ms',
  },

  deleteText: {
    fontWeight: 700,
    color: ERROR_RED,
  },

  sheetContent: {
    backgroundColor: MAIN_BACKGROUND,
  },

  sheetBackground: {
    backgroundColor: MAIN_BACKGROUND,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  sheetHandle: {
    width: '11%',
    height: '2@s',
    backgroundColor: PROFILE_TEXT,
  },

  modalHeader: {
    paddingInline: '4%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: '0@s',
  },

  modalHeaderOption: {
    width: '44%',
  },

  modalHeaderText: {
    fontSize: '15@ms',
    fontWeight: 600,
    color: PROFILE_TEXT,
    textAlign: 'center',
    paddingBlock: '7@s',
  },

  modalSeperator: {
    width: '100%',
    height: '1@s',
    backgroundColor: PROFILE_TEXT,
  },

  modalPictureContainer: {
    paddingInline: '4%',
    paddingBlock: '10@s',
  },

  modalPictureButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10@s',
    paddingBlock: '10@s',
    marginBlock: '1@s',
  },

  modalPictureIcon: {
    color: PROFILE_TEXT,
  },

  modalPictureText: {
    fontSize: '16@ms',
    fontWeight: 500,
    color: PROFILE_TEXT,
  },

  modalPictureDelete: {
    color: '#f21a17',
  },

  modalColorContainer: {
    padding: '4%',
  },
})
