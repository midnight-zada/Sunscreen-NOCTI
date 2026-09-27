import DropInput from '@/components/DropInput'
import ErrorScreen from '@/components/ErrorScreen'
import LoadingDots from '@/components/LoadingDots'
import Separator from '@/components/Separator'
import { useAppContext } from '@/context/AppContext'
import { useUserSunscreens } from '@/context/UserSunscreenContext'
import { MAIN_BACKGROUND, PROFILE_ICON, PROFILE_TEXT, SEPARATOR } from '@/lib/constants'
import {
  commitUserSunscreenImage,
  COVERAGE_OPTIONS,
  discardCommittedUserSunscreenImage,
  discardStagedUserSunscreenImage,
  editUserSunscreen,
  FORM_OPTIONS,
  ImageType,
  InsertUserSunscreen,
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
import { Alert, Pressable, Text, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { moderateScale, ms, scale, ScaledSheet } from 'react-native-size-matters'

const INFO_SEPARATOR_GRADIENT = {
  colors: [SEPARATOR, SEPARATOR, MAIN_BACKGROUND],
  locations: [0, 0.7, 1],
} as const

const IMAGE_HEADER_GRADIENT = {
  colors: [MAIN_BACKGROUND, SEPARATOR, SEPARATOR, MAIN_BACKGROUND],
  locations: [0, 0.15, 0.85, 1],
} as const

const PLACEHOLDER_COLOR = PROFILE_ICON

type EditSheetMode = 'color' | 'picture' | null

const EditUserSunscreen = () => {
  const insets = useSafeAreaInsets()
  const { db, userId } = useAppContext()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { getById, refreshUserSunscreens } = useUserSunscreens()

  const [editSunscreen, setEditSunscreen] = useState<InsertUserSunscreen | null>(null)
  const [sheetMode, setSheetMode] = useState<EditSheetMode>(null)
  const [imageType, setImageType] = useState<ImageType | null>(null)
  const [isWaitingLibrary, setIsWaitingLibrary] = useState(false)
  const [isWaitingPhoto, setIsWaitingPhoto] = useState(false)

  const sunscreenId = Number(id)
  const sunscreen = getById(sunscreenId)

  const editSheetRef = useRef<BottomSheetModal>(null)
  const stagedImages = useRef<Partial<Record<ImageType, string>>>({})
  const removedImages = useRef<Set<ImageType>>(new Set())

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
    if (!sunscreen) return
    const { id, is_archived, created_at, updated_at, synced_at, ...insertSunscreen } =
      sunscreen
    setEditSunscreen(insertSunscreen)
  }, [sunscreen])

  const cancelEdit = () => {
    discardAllStagedImages()
    router.back()
  }

  const getFieldErrors = (sunscreen: InsertUserSunscreen) => {
    const errors: string[] = []

    if (!sunscreen.spf || sunscreen.spf <= 0) {
      errors.push("SPF must be greater than 0")
    }

    if (!sunscreen.duration || sunscreen.duration <= 0) {
      errors.push("Duration must be greater than 0")
    }

    return errors
  }

  const confirmEdit = async () => {
    try {
      if (editSunscreen) {
        let confirmEditSunscreen = editSunscreen

        const fieldErrors = getFieldErrors(confirmEditSunscreen)
        
        if (fieldErrors.length > 0) {
          await notificationAsync(NotificationFeedbackType.Error)
          Alert.alert('Invalid Input(s)', fieldErrors.join('\n'))
          return
        }

        for (const [type, stagedURI] of Object.entries(stagedImages.current) as [
          ImageType,
          string,
        ][]) {
          const commitURI = await commitUserSunscreenImage(sunscreenId, stagedURI, type)
          confirmEditSunscreen =
            type === 'cover'
              ? { ...confirmEditSunscreen, cover_uri: commitURI }
              : { ...confirmEditSunscreen, image_uri: commitURI }
        }

        for (const type of removedImages.current) {
          if (!stagedImages.current[type])
            discardCommittedUserSunscreenImage(sunscreenId, type)
        }

        stagedImages.current = {}
        removedImages.current = new Set()

        await editUserSunscreen(db, sunscreenId, confirmEditSunscreen)
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
    }
  }

  const editProductImage = async () => {
    setSheetMode('picture')
    setImageType('product')
    editSheetRef.current?.present()
  }

  const editCoverImage = async () => {
    setSheetMode('picture')
    setImageType('cover')
    editSheetRef.current?.present()
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    []
  )

  const stageImageResults = (
    imageResult: [string, string | null] | null,
    type: ImageType
  ) => {
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
  }

  const uploadImage = async () => {
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
  }

  const takeImage = async () => {
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
  }

  const removeImage = async () => {
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
            size={ms(26)}
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
          bottomOffset={20}
          keyboardShouldPersistTaps="handled"
        >
          {editSunscreen.nickname === null ? (
            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{editSunscreen.name}</Text>
                <Pressable
                  onPress={() =>
                    setEditSunscreenField(
                      'is_favorite',
                      editSunscreen.is_favorite ? 0 : 1
                    )
                  }
                  hitSlop={5}
                >
                  <Ionicons
                    name={editSunscreen.is_favorite ? 'star' : 'star-outline'}
                    size={ms(28)}
                    color={editSunscreen.is_favorite ? '#ffed4c' : PROFILE_ICON}
                  />
                </Pressable>
              </View>
              {editSunscreen.brand && (
                <Text style={[styles.subNameText]}>
                  <Text style={styles.by}>by</Text> {editSunscreen.brand}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{editSunscreen.nickname}</Text>
                <Pressable
                  onPress={() =>
                    setEditSunscreenField(
                      'is_favorite',
                      editSunscreen.is_favorite ? 0 : 1
                    )
                  }
                  hitSlop={5}
                >
                  <Ionicons
                    name={editSunscreen.is_favorite ? 'star' : 'star-outline'}
                    size={ms(28)}
                    color={editSunscreen.is_favorite ? '#ffed4c' : PROFILE_ICON}
                  />
                </Pressable>
              </View>
              {editSunscreen.brand && (
                <View style={[styles.subNameSection]}>
                  <Text style={styles.subNameText}>
                    {editSunscreen.name}{' '}
                    <Text style={styles.by}>{editSunscreen.brand && 'by'}</Text>
                  </Text>
                  <Text style={styles.subNameText}>{editSunscreen.brand}</Text>
                </View>
              )}
            </View>
          )}
          <Separator />
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <Text style={[styles.infoKey, styles.imageHeaderText]}>Cover</Text>
              <Separator gradient={IMAGE_HEADER_GRADIENT} scaleMargin={[3, 5]} />
              <View
                style={[
                  styles.imageBorder,
                  {
                    borderColor: editSunscreen.cover_border_color
                      ? editSunscreen.cover_border_color
                      : SEPARATOR,
                  },
                ]}
              >
                <Image
                  source={
                    editSunscreen.cover_uri
                      ? { uri: editSunscreen.cover_uri }
                      : require('../assets/images/placeholder.jpg')
                  }
                  style={styles.image}
                />
              </View>
              <Pressable style={styles.editButton} onPress={editCoverImage}>
                <Text style={styles.editText}>Edit</Text>
                <Ionicons name="create-outline" size={ms(16)} color={PROFILE_TEXT} />
              </Pressable>
            </View>
            <View style={styles.imageContainer}>
              <Text style={[styles.infoKey, styles.imageHeaderText]}>Product</Text>
              <Separator gradient={IMAGE_HEADER_GRADIENT} scaleMargin={[3, 5]} />
              <View
                style={[
                  styles.imageBorder,
                  {
                    borderColor: editSunscreen.border_color
                      ? editSunscreen.border_color
                      : SEPARATOR,
                  },
                ]}
              >
                <Image
                  source={
                    editSunscreen.image_uri
                      ? { uri: editSunscreen.image_uri }
                      : require('../assets/images/placeholder.jpg')
                  }
                  style={styles.image}
                />
              </View>
              <Pressable style={styles.editButton} onPress={editProductImage}>
                <Text style={styles.editText}>Edit</Text>
                <Ionicons name="create-outline" size={ms(16)} color={PROFILE_TEXT} />
              </Pressable>
            </View>
          </View>
          <Separator />
          <View style={styles.infoSection}>
            <View style={styles.infoColumn}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>SPF</Text>
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
                <Text style={styles.infoKey}>Duration</Text>
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
                />
              </View>
            </View>
          </View>
          <View style={[styles.notes, styles.infoRow]}>
            <Text style={styles.infoKey}>Notes</Text>
            <Separator gradient={INFO_SEPARATOR_GRADIENT} />
            <TextInput
              style={styles.noteInput}
              value={editSunscreen.notes || ''}
              onChange={(e) => setEditSunscreenField('notes', e.nativeEvent.text)}
              multiline
            />
          </View>
          <View style={[styles.notes, styles.infoRow]}>
            <Text style={styles.infoKey}>Barcode</Text>
            <Separator gradient={INFO_SEPARATOR_GRADIENT} />
            <TextInput
              style={styles.noteInput}
              value={editSunscreen.barcode || ''}
              onChange={(e) => setEditSunscreenField('barcode', e.nativeEvent.text)}
              multiline
            />
          </View>
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
                  <LoadingDots color={'#000'} size={scale(5)} />
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
                  <LoadingDots color={'#000'} size={scale(5)} />
                ) : (
                  <Text style={styles.modalPictureText}>Take photo</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.modalPictureButton}
                onPress={removeImage}
              >
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
              <Text>[Placeholder]</Text>
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
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
    paddingBlockEnd: '12@s',
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

  editButton: {
    width: '135@s',
    paddingBlock: '5@s',
    marginBlockStart: '7@s',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6@s',
    backgroundColor: SEPARATOR,
    borderRadius: 3,
  },

  editText: {
    fontSize: '16@ms',
    fontWeight: 500,
    color: PROFILE_TEXT,
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
    marginInlineEnd: '5@s',
    paddingInline: '5@s',
    paddingBlock: '3@s',
    fontSize: '16@ms',
    fontWeight: 500,
    color: PROFILE_ICON,
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 3,
  },

  notes: {
    paddingInline: '3%',
    paddingBlockEnd: '10@s',
  },

  noteInput: {
    paddingInline: '5@s',
    paddingBlock: '3@s',
    fontSize: '16@ms',
    fontWeight: 500,
    color: PROFILE_ICON,
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 3,
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

  sheetContent: {
    flex: 1,
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
    textAlign: 'center',
    paddingBlock: '7@s',
  },

  modalSeperator: {
    width: '100%',
    height: '1@s',
    backgroundColor: '#000',
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
    color: '#000000',
  },

  modalPictureText: {
    fontSize: '16@ms',
    fontWeight: 500,
  },

  modalPictureDelete: {
    color: '#f21a17',
  },

  modalColorContainer: {
    padding: '4%',
  },
})
