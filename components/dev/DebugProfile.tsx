import { clearTable, resetDB } from '@/lib/db'
import {
  getUserProfile,
  InsertUserProfile,
  insertUserProfile,
  pickProfileImage,
  updateUserProfile,
} from '@/lib/userProfile'
import { Pressable, Text, View } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { useAppContext } from '../../context/AppContext'

type DebugProfileProps = {
  refreshProfile: () => void
}

const DebugProfile = ({ refreshProfile }: DebugProfileProps) => {
  const { db, userId } = useAppContext()

  const userData: InsertUserProfile = {
    user_id: userId,
    display_name: 'midnightzada',
    bio: 'Bio TEST Bio TEST Bio TEST Bio TEST Bio TEST Bio TEST Bio TEST Bio TEST Bio TEST',
    skin_type: 'type_3',
    profile_image_uri: null,
  }

  const loadUser = async () => {
    const result = await insertUserProfile(db, userData)

    if (result) console.log('Inserted -', userId)
    else console.log('Failed Insert -', result)

    refreshProfile()
  }

  const uploadImage = async () => {
    const uri = await pickProfileImage(userId)

    if (uri) {
      await updateUserProfile(db, userId, { profile_image_uri: uri })
      console.log('Updated Profile Image:', uri)
      refreshProfile()
    }
  }

  const dropUser = async () => {
    await clearTable(db, 'user_profile')
    console.log('Dropped User Profile Data')
    refreshProfile()
  }

  const printUser = async () => {
    const profileData = await getUserProfile(db, userId)
    console.log(profileData)
  }

  const hardReset = async () => {
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
