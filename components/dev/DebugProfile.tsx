import { clearTable, resetDB } from '@/lib/db'
import {
  getUserProfile,
  InsertUserProfile,
  insertUserProfile,
  pickProfileImage,
  setProfileImage,
  updateUserProfile,
} from '@/lib/userProfile'
import { Pressable, Text, View } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { impactAsync, ImpactFeedbackStyle, notificationAsync, NotificationFeedbackType } from 'expo-haptics'

import { useAppContext } from '../../context/AppContext'

type DebugProfileProps = {
  refreshProfile: () => void
}

const DebugProfile = ({ refreshProfile }: DebugProfileProps) => {
  const { db, userId } = useAppContext()

  const userData: InsertUserProfile = {
    user_id: userId,
    display_name: '[placeholder]',
    bio: '[placeholder]',
    skin_type: 'type_3',
    profile_image_uri: null,
    image_border_color: '#faf9f6',
  }

  const loadUser = async () => {
    await impactAsync(ImpactFeedbackStyle.Soft)
    const result = await insertUserProfile(db, userData)

    if (result) console.log('Inserted -', userId)
    else console.log('Failed Insert -', result)

    refreshProfile()
  }

  const uploadImage = async () => {
    await impactAsync(ImpactFeedbackStyle.Soft)
    const imageResult = await pickProfileImage(userId)
    if (!imageResult) return

    const [uri, borderColor] = imageResult

    if (uri) {
      await setProfileImage(db, userId, uri, borderColor)
      console.log('Updated Profile Image:', imageResult)
      await notificationAsync(NotificationFeedbackType.Success)
      refreshProfile()
    }
  }

  const dropUser = async () => {
    await impactAsync(ImpactFeedbackStyle.Medium)
    await clearTable(db, 'user_profile')
    console.log('Dropped User Profile Data')
    refreshProfile()
  }

  const printUser = async () => {
    await impactAsync(ImpactFeedbackStyle.Soft)
    const profileData = await getUserProfile(db, userId)
    console.log(profileData)
  }

  const hardReset = async () => {
    await impactAsync(ImpactFeedbackStyle.Medium)
    await resetDB(db)
    console.log('DB Reset Complete')
  }

  return (
    <View style={styles.debugSection}>
      <View style={styles.debugRow}>
        <Pressable style={styles.debugButton} onPress={loadUser}>
          <Text style={styles.buttonText}>Load User</Text>
        </Pressable>
        <Pressable style={styles.debugButton} onPress={uploadImage}>
          <Text style={styles.buttonText}>Upload Image</Text>
        </Pressable>
      </View>
      <View style={styles.debugRow}>
        <Pressable style={styles.debugButton} onPress={dropUser}>
          <Text style={styles.buttonText}>Drop User</Text>
        </Pressable>
        <Pressable style={styles.debugButton} onPress={printUser}>
          <Text style={styles.buttonText}>Print User</Text>
        </Pressable>
      </View>
      <View style={styles.debugRow}>
        <Pressable style={styles.debugButton} onPress={hardReset}>
          <Text style={styles.buttonText}>Hard Reset</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default DebugProfile

const styles = ScaledSheet.create({
  debugSection: {
    paddingInline: '3%',
    paddingBlock: '30@s',
    gap: '10@s',
  },

  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: '10@s',
  },

  debugButton: {
    flex: 1,
    backgroundColor: '#9fa6f1',
    borderRadius: 20,
    paddingBlock: '8@s',
  },

  buttonText: {
    textAlign: 'center',
    fontSize: '16@ms',
    fontWeight: 500,
  },
})
