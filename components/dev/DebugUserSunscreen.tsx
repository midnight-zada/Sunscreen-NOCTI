import { clearTable } from '@/lib/db'
import { getUserSunscreens, insertUserSunscreen } from '@/lib/userSunscreen'
import { notificationAsync, NotificationFeedbackType } from 'expo-haptics'
import { Pressable, Text, View } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

import {
  getUserSunscreenData,
  getUserSunscreenPlaceholder,
} from '@/constants/dev/userSunscreenData'
import { useAppContext } from '../../context/AppContext'

type DebugUserSunscreenProps = {
  refreshLog: () => Promise<void>
}

const DebugUserSunscreen = ({ refreshLog }: DebugUserSunscreenProps) => {
  const { db, userId } = useAppContext()

  const loadUserSunscreen = async () => {
    try {
      const sunscreenData = getUserSunscreenPlaceholder(userId)
      const result = await insertUserSunscreen(db, sunscreenData)
      await refreshLog()
      await notificationAsync(NotificationFeedbackType.Success)
      console.log(`Inserted: ${result}`)
    } catch (error) {
      await notificationAsync(NotificationFeedbackType.Error)
      console.error(
        `Failed Insert: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const printUserSunscreens = async () => {
    try {
      const data = await getUserSunscreens(db)

      for (let i = 0; i < data.length; i++) console.log(data[i])

      await notificationAsync(NotificationFeedbackType.Success)
    } catch (error) {
      await notificationAsync(NotificationFeedbackType.Error)
      console.log(
        `Failed Print: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const loadUserSunscreenList = async () => {
    try {
      const results = []
      const userSunscreenData = getUserSunscreenData(userId)

      for (let i = 0; i < userSunscreenData.length; i++) {
        const result = await insertUserSunscreen(db, userSunscreenData[i])
        results.push(result)
      }

      await refreshLog()
      await notificationAsync(NotificationFeedbackType.Success)
      console.log(`Loaded User Sunscreen Data: [${results}]`)
    } catch (error) {
      await notificationAsync(NotificationFeedbackType.Error)
      console.log(
        `Failed To Load User Sunscreen Data: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const dropUserSunscreens = async () => {
    try {
      await clearTable(db, 'user_sunscreen')
      await refreshLog()
      await notificationAsync(NotificationFeedbackType.Success)
      console.log('Dropped User Sunscreen Data')
    } catch (error) {
      await notificationAsync(NotificationFeedbackType.Error)
      console.log(
        `Failed To Drop User Sunscreen Data: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return (
    <View style={styles.debugSection}>
      <View style={styles.debugRow}>
        <Pressable style={styles.debugButton} onPress={loadUserSunscreen}>
          <Text style={styles.buttonText}>Add Placeholder</Text>
        </Pressable>
        <Pressable style={styles.debugButton} onPress={printUserSunscreens}>
          <Text style={styles.buttonText}>Print Sunscreens</Text>
        </Pressable>
      </View>
      <View style={styles.debugRow}>
        <Pressable style={styles.debugButton} onPress={loadUserSunscreenList}>
          <Text style={styles.buttonText}>Load Table</Text>
        </Pressable>
      </View>
      <View style={styles.debugRow}>
        <Pressable style={styles.debugButton} onPress={dropUserSunscreens}>
          <Text style={styles.buttonText}>Clear Table</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default DebugUserSunscreen

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
