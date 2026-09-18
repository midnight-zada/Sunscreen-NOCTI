import DebugProfile from '@/components/dev/DebugProfile'
import DebugUserSunscreen from '@/components/dev/DebugUserSunscreen'
import { useAppContext } from '@/context/AppContext'
import { PROFILE_SCREEN_BG_COLOR } from '@/lib/constants'
import { getUserProfile, UserProfile } from '@/lib/userProfile'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { moderateScale, ScaledSheet } from 'react-native-size-matters'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { db, userId } = useAppContext()
  const [profileData, setProfileData] = useState<UserProfile | null>(null)

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
      <View style={styles.header}>
        <Pressable onPress={openSettings} hitSlop={7}>
          <Ionicons name="settings-outline" size={moderateScale(28)} />
        </Pressable>
        <Pressable hitSlop={7}>
          <Ionicons name="ellipsis-horizontal" size={moderateScale(28)} />
        </Pressable>
      </View>
      <View style={[styles.main]}>
        <View
          style={[
            styles.profileBorder,
            {
              borderColor: profileData?.image_border_color || 'transparent',
            },
          ]}
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
        </View>
        <View style={[styles.badgeSection]}>
          <View style={[styles.badge, styles.firstBadge]}>
            <Ionicons name="help-outline" size={moderateScale(40)} color="#222" />
          </View>
          <View style={[styles.badge, styles.secondBadge]}>
            <Ionicons name="help-outline" size={moderateScale(40)} color="#222" />
          </View>
          <View style={[styles.badge, styles.thirdBadge]}>
            <Ionicons name="help-outline" size={moderateScale(40)} color="#222" />
          </View>
        </View>
      </View>
      <View style={styles.profileText}>
        <Text style={styles.displayName}>{profileData?.display_name}</Text>
        <Text style={styles.bio}>{profileData?.bio}</Text>
      </View>
      <View style={styles.seperator} />
      <DebugProfile refreshProfile={refreshProfile} />
    </View>
  )
}

const styles = ScaledSheet.create({
  profile: {
    flex: 1,
    backgroundColor: PROFILE_SCREEN_BG_COLOR,
  },

  header: {
    paddingInline: '4%',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    borderRadius: 23,
    borderWidth: '1.8@s',
  },

  profilePicture: {
    width: '98.8@s',
    aspectRatio: 1,
    backgroundColor: '#4c4c4c',
    borderRadius: 20,
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
    borderColor: '#222',
    borderWidth: '2.5@s',
    borderRadius: 12,
  },

  firstBadge: {},

  secondBadge: {},

  thirdBadge: {},

  profileText: {
    paddingInline: '3%',
    gap: '5@s',
    paddingBlock: '8@s',
  },

  displayName: {
    fontSize: '34@ms',
    fontWeight: 600,
  },

  bio: {
    fontSize: '14@ms',
    fontWeight: 500,
  },

  seperator: {
    width: '100%',
    height: '1@s',
    backgroundColor: '#c5c5c5'
  }
})
