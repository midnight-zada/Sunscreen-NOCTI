import { LoadingDots } from '@/components/LoadingDots'
import { useAppContext } from '@/context/AppContext'
import { PROFILE_SCREEN_BG_COLOR } from '@/lib/constants'
import { getBWContrast } from '@/lib/imageColor'
import {
  getUserProfile,
  pickProfileImage,
  setProfileImage,
  takeProfilePhoto,
  updateUserProfile,
  UserProfile,
} from '@/lib/userProfile'
import { Ionicons } from '@expo/vector-icons'
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { moderateScale, scale, ScaledSheet } from 'react-native-size-matters'

type EditSheetMode = 'color' | 'picture' | null

export const EditProfile = () => {
  const insets = useSafeAreaInsets()
  const { db, userId } = useAppContext()

  const [displayName, setDisplayName] = useState<string | null>(null)
  const [bio, setBio] = useState<string | null>(null)
  const [borderColor, setBorderColor] = useState<string | null>(null)
  const [profileURI, setProfileURI] = useState<string | null>(null)

  const [sheetMode, setSheetMode] = useState<EditSheetMode>(null)
  const editSheetRef = useRef<BottomSheetModal>(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [isWaitingLibrary, setIsWaitingLibrary] = useState(false)
  const [isWaitingPhoto, setIsWaitingPhoto] = useState(false)

  useEffect(() => {
    let cancelled = false

    const initializeData = async () => {
      const initData: UserProfile | null = await getUserProfile(db, userId)

      if (cancelled) return

      if (initData) {
        setProfileURI(initData.profile_image_uri)
        setBorderColor(initData.image_border_color)
        setDisplayName(initData.display_name)
        setBio(initData.bio)
      }

      setIsLoaded(true)
    }

    initializeData()

    return () => {
      cancelled = true
    }
  }, [])

  const cancel = () => {
    if (isSaving) return
    router.back()
  }

  const save = async () => {
    if (!isLoaded || isSaving) return

    setIsSaving(true)

    try {
      await updateUserProfile(db, userId, {
        display_name: displayName,
        bio: bio,
      })
      await setProfileImage(db, userId, profileURI, profileURI ? borderColor : null)
      await notificationAsync(NotificationFeedbackType.Success)
      router.back()
    } catch (error) {
      console.log(
        `Error Saving Profile: ${error instanceof Error ? error.message : String(error)}`
      )
      await notificationAsync(NotificationFeedbackType.Error)
      setIsSaving(false)
    }
  }

  const openEditColor = () => {
    setSheetMode('color')
    editSheetRef.current?.present()
  }

  const openEditPicture = () => {
    setSheetMode('picture')
    editSheetRef.current?.present()
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    []
  )

  const applyImageResult = (imageResult: [string, string | null] | null) => {
    setIsWaitingLibrary(false)
    setIsWaitingPhoto(false)

    if (!imageResult) return

    const [uri, borderColor] = imageResult
    setProfileURI(uri)
    setBorderColor(borderColor)
    editSheetRef.current?.close()
  }

  const uploadImage = async () => {
    try {
      setIsWaitingLibrary(true)
      applyImageResult(await pickProfileImage(userId))
    } catch (error) {
      setIsWaitingLibrary(false)
      console.log(
        `Error Picking Image: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const takeImage = async () => {
    try {
      setIsWaitingPhoto(true)
      applyImageResult(await takeProfilePhoto(userId))
    } catch (error) {
      setIsWaitingPhoto(false)
      console.log(
        `Error Taking Photo: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return (
    <View style={[styles.settings]}>
      <View
        style={[
          styles.header,
          {
            paddingBlockStart: insets.top,
          },
        ]}
      >
        <Pressable
          style={[styles.button, styles.cancel]}
          onPress={cancel}
          disabled={isSaving}
          hitSlop={10}
        >
          <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
        </Pressable>
        <Text style={styles.h1}>Edit Profile</Text>
        <Pressable
          style={[styles.button, styles.confirm]}
          onPress={save}
          disabled={!isLoaded || isSaving}
          hitSlop={10}
        >
          <Text
            style={[
              styles.buttonText,
              styles.saveText,
              (!isLoaded || isSaving) && styles.saveTextDisabled,
            ]}
          >
            Save
          </Text>
        </Pressable>
      </View>
      <View style={styles.seperator} />
      <View style={styles.main}>
        <View style={styles.profileImageSection}>
          <View
            style={[
              styles.profileBorder,
              {
                borderColor: borderColor || 'transparent',
              },
            ]}
          >
            <View style={[styles.profilePicture]}>
              <Image
                source={
                  profileURI
                    ? { uri: profileURI }
                    : require('../assets/images/placeholder.jpg')
                }
                style={styles.profileImage}
              />
            </View>
          </View>
          <View style={styles.rightSection}>
            <View
              style={[
                styles.colorSwatch,
                {
                  backgroundColor: borderColor || 'transparent',
                },
              ]}
            >
              <Text
                style={[
                  styles.colorHex,
                  {
                    color: getBWContrast(borderColor),
                  },
                ]}
              >
                {borderColor}
              </Text>
            </View>
            <View style={styles.editSection}>
              <Pressable onPress={openEditColor} hitSlop={8}>
                <Text style={styles.editText}>Edit Border Color</Text>
              </Pressable>
              <LinearGradient
                colors={[
                  'rgba(197, 197, 197, 0)',
                  '#c5c5c5',
                  '#c5c5c5',
                  'rgba(197, 197, 197, 0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                locations={[0, 0.1, 0.9, 1]}
                style={styles.editSeperator}
              />
              <Pressable onPress={openEditPicture} hitSlop={8}>
                <Text style={styles.editText}>Edit Picture</Text>
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.seperator} />
        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              numberOfLines={1}
              value={displayName ?? ''}
              onChangeText={setDisplayName}
              placeholder="Add a display name"
              placeholderTextColor={'#9a9a9a'}
            />
          </View>
          <View style={styles.inputSeperatorRow}>
            <View style={styles.inputSeperatorSpacer} />
            <View style={[styles.seperator, styles.inputSeperatorLine]} />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={styles.input}
              value={bio ?? ''}
              onChangeText={setBio}
              placeholder="Add a bio"
              placeholderTextColor={'#9a9a9a'}
              multiline
            />
          </View>
        </View>
        <View style={styles.seperator} />
      </View>
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
              <Pressable style={styles.modalPictureButton} onPress={takeImage}>
                <Ionicons
                  name="camera-outline"
                  size={moderateScale(25)}
                  style={styles.modalPictureIcon}
                  disabled={isWaitingPhoto}
                />
                {isWaitingPhoto ? (
                  <LoadingDots color={'#000'} size={scale(5)} />
                ) : (
                  <Text style={styles.modalPictureText}>Take photo</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.modalPictureButton}
                onPress={() => {
                  setProfileURI(null)
                  setBorderColor(null)
                  editSheetRef.current?.close()
                }}
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

export default EditProfile

const styles = ScaledSheet.create({
  settings: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PROFILE_SCREEN_BG_COLOR,
    paddingInline: '4%',
    paddingBlock: '8@s',
  },

  h1: {
    fontWeight: 800,
    fontSize: '16@ms',
    color: '#1f1f1f',
  },

  button: {
    paddingBlock: '4@s',
  },

  cancel: {},

  confirm: {},

  buttonText: {
    fontSize: '16@ms',
  },

  cancelText: {
    fontWeight: 400,
    color: '#6a6a6a',
  },

  saveText: {
    fontWeight: 700,
    color: '#ff2800',
  },

  saveTextDisabled: {
    opacity: 0.4,
    color: '#000',
  },

  main: {
    flex: 1,
    backgroundColor: PROFILE_SCREEN_BG_COLOR,
    paddingBlock: '25@s',
  },

  profileImageSection: {
    paddingInline: '4%',
    flexDirection: 'row',
    gap: '20@s',
    paddingBlockEnd: '20@s',
  },

  profileBorder: {
    width: '114@s',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    borderWidth: '1.9@s',
  },

  profilePicture: {
    width: '107@s',
    aspectRatio: 1,
    backgroundColor: '#4c4c4c',
    borderRadius: 20,
    overflow: 'hidden',
  },

  profileImage: {
    width: '100%',
    aspectRatio: 1,
  },

  rightSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12@s',
  },

  editSection: {
    gap: '7@s',
    alignItems: 'center',
    width: '100%',
  },

  colorSwatch: {
    width: '100%',
    height: '30@s',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  colorHex: {
    fontSize: '18@s',
    fontWeight: 800,
    letterSpacing: '5@ms',
    textTransform: 'uppercase',
  },

  seperator: {
    height: 1,
    width: '100%',
    backgroundColor: '#c5c5c5',
  },

  editText: {
    fontSize: '15@ms',
    fontWeight: 600,
    color: '#2f81fb',
  },

  editSeperator: {
    height: 1,
    width: '100%',
  },

  inputSection: {
    paddingInline: '4%',
  },

  inputRow: {
    flexDirection: 'row',
    paddingBlock: '10@s',
  },

  inputLabel: {
    width: '70@s',
    fontSize: '15@ms',
    fontWeight: 600,
    color: '#1f1f1f',
  },

  inputSeperatorRow: {
    flexDirection: 'row',
  },

  inputSeperatorSpacer: {
    width: '70@s',
  },

  inputSeperatorLine: {
    flex: 1,
    width: undefined,
    marginInlineEnd: '-4%',
  },

  input: {
    flex: 1,
    width: 0,
    fontSize: '15@ms',
    color: '#1f1f1f',
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
