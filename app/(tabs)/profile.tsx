import DebugProfile from '@/components/dev/DebugProfile'
import ImageViewer from '@/components/ImageViewer'
import Separator from '@/components/Separator'
import { SEPARATOR_LIGHT_COLOR } from '@/constants/colors'
import { useAppContext } from '@/context/AppContext'
import { FONT_TITLE, MAIN_BACKGROUND, PROFILE_TEXT } from '@/lib/constants'
import { getUserProfile, UserProfile } from '@/lib/userProfile'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { moderateScale, ScaledSheet } from 'react-native-size-matters'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { db, userId } = useAppContext()
  const [profileData, setProfileData] = useState<UserProfile | null>(null)

  const [isImageFocused, setIsImageFocused] = useState(false)

  const refreshProfile = useCallback(async () => {
    const data = await getUserProfile(db, userId)
    setProfileData(data)
  }, [db, userId])

  useFocusEffect(
    useCallback(() => {
      refreshProfile()
    }, [refreshProfile])
  )

  const openSettings = () => {
    router.push('/editProfile')
  }

  return (
    <View
      style={[
        styles.profile,
        {
          paddingBlockStart: insets.top,
        },
      ]}
    >
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Pressable onPress={openSettings} hitSlop={7}>
            <Ionicons
              name="settings-outline"
              size={moderateScale(24)}
              color={PROFILE_TEXT}
            />
          </Pressable>
        </View>
        <View style={styles.headerName}>
          <Text style={[styles.text, styles.displayName]} numberOfLines={1}>
            {profileData?.display_name}
          </Text>
        </View>
        <View style={[styles.headerIcon, { alignItems: 'flex-end' }]}>
          <Pressable hitSlop={7}>
            <Ionicons
              name="ellipsis-horizontal"
              size={moderateScale(24)}
              color={PROFILE_TEXT}
            />
          </Pressable>
        </View>
      </View>
      <View style={[styles.main]}>
        <Pressable
          style={[
            styles.profileBorder,
            {
              borderColor: profileData?.image_border_color || 'transparent',
            },
          ]}
          onPress={() => setIsImageFocused(true)}
        >
          <View style={[styles.profilePicture]}>
            <Image
              source={
                profileData?.profile_image_uri
                  ? { uri: profileData.profile_image_uri }
                  : require('../../assets/images/placeholder.jpg')
              }
              style={styles.profileImage}
            />
          </View>
        </Pressable>
        <View style={[styles.badgeSection]}>
          <View style={[styles.badge, styles.firstBadge]}>
            <Ionicons
              name="help-outline"
              size={moderateScale(40)}
              color={SEPARATOR_LIGHT_COLOR}
            />
          </View>
          <View style={[styles.badge, styles.secondBadge]}>
            <Ionicons
              name="help-outline"
              size={moderateScale(40)}
              color={SEPARATOR_LIGHT_COLOR}
            />
          </View>
          <View style={[styles.badge, styles.thirdBadge]}>
            <Ionicons
              name="help-outline"
              size={moderateScale(40)}
              color={SEPARATOR_LIGHT_COLOR}
            />
          </View>
        </View>
      </View>
      <View style={styles.profileText}>
        <Text style={[styles.text, styles.bio]}>{profileData?.bio}</Text>
      </View>
      <Separator color={SEPARATOR_LIGHT_COLOR} />
      <DebugProfile refreshProfile={refreshProfile} />
      <ImageViewer
        isFocused={isImageFocused}
        setIsFocused={setIsImageFocused}
        source={profileData ? profileData.profile_image_uri : null}
      />
    </View>
  )
}

const styles = ScaledSheet.create({
  profile: {
    flex: 1,
    backgroundColor: MAIN_BACKGROUND,
  },

  header: {
    marginBlockStart: '10@s',
    paddingInline: '4%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
  },

  headerIcon: {
    width: '12%',
    justifyContent: 'center',
  },

  headerName: {
    maxWidth: '70%',
    justifyContent: 'center',
  },

  main: {
    paddingInline: '3%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: '12@s',
    paddingBlockStart: '20@s',
  },

  profileBorder: {
    width: '105@s',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    borderWidth: '2@s',
  },

  profilePicture: {
    width: '97@s',
    aspectRatio: 1,
    borderRadius: 26,
    overflow: 'hidden',
  },

  profileImage: {
    width: '100%',
    aspectRatio: 1,
  },

  badgeSection: {
    flex: 1,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },

  badge: {
    width: '63@s',
    aspectRatio: 1 / 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: SEPARATOR_LIGHT_COLOR,
    borderWidth: '2.5@s',
    borderRadius: 12,
  },

  firstBadge: {},

  secondBadge: {},

  thirdBadge: {},

  text: {
    color: PROFILE_TEXT,
  },

  profileText: {
    paddingInline: '3%',
    gap: '5@s',
    paddingBlock: '8@s',
  },

  displayName: {
    fontSize: `${FONT_TITLE}@s`,
    fontWeight: 600,
  },

  bio: {
    fontSize: '14@ms',
    fontWeight: 500,
  },
})
