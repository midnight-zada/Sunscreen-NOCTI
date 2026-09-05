import DebugProfile from '@/components/dev/DebugProfile'
import { useAppContext } from '@/context/AppContext'
import { getUserProfile, UserProfile } from '@/lib/userProfile'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { moderateScale, ScaledSheet } from 'react-native-size-matters'

export default function ProfileScreen() {
  const { db, userId } = useAppContext()
  const [profileData, setProfileData] = useState<UserProfile | null>(null)

  const refreshProfile = useCallback(async () => {
    const data = await getUserProfile(db, userId)
    setProfileData(data)
  }, [db, userId])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  return (
    <View style={styles.profile}>
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={moderateScale(28)} />
        <Ionicons name="ellipsis-horizontal" size={moderateScale(28)} />
      </View>
      <View style={[styles.main]}>
        <View style={styles.profileBorder}>
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
      <DebugProfile refreshProfile={refreshProfile} />
    </View>
  )
}

const styles = ScaledSheet.create({
  profile: {
    flex: 1,
    paddingInline: '3%',
    backgroundColor: '#faf9f6',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  main: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBlockStart: '20@s',
    paddingBlockEnd: '8@s',
  },

  profileBorder: {
    width: '106@s',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    borderColor: '#6b37cd',
    borderWidth: '1.8@s',
  },

  profilePicture: {
    width: '99@s',
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
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    alignItems: 'center',
  },

  badge: {
    width: '63@s',
    aspectRatio: 1 / 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#222',
    borderWidth: '3@s',
    borderRadius: 12,
  },

  firstBadge: {},

  secondBadge: {},

  thirdBadge: {},

  profileText: {
    gap: '5@s',
  },

  displayName: {
    fontSize: '34@ms',
    fontWeight: 600,
  },

  bio: {
    fontSize: '14@ms',
    fontWeight: 500,
  },
})
