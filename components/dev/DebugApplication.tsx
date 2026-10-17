import { useApplications } from '@/context/ApplicationContext'
import { clearTable } from '@/lib/db'
import {
  impactAsync,
  ImpactFeedbackStyle,
  notificationAsync,
  NotificationFeedbackType,
} from 'expo-haptics'
import { Pressable, Text, View } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

import { useAppContext } from '../../context/AppContext'

const DebugApplication = () => {
  const { db } = useAppContext()
  const { applications, refreshApplications } = useApplications()

  const printApplications = async () => {
    await impactAsync(ImpactFeedbackStyle.Soft)
    for (let i = 0; i < applications.length; i++) console.log(applications[i])
  }

  const dropApplications = async () => {
    try {
      await impactAsync(ImpactFeedbackStyle.Medium)
      await clearTable(db, 'application')
      await refreshApplications()
      await notificationAsync(NotificationFeedbackType.Success)
      console.log('Dropped Application Data')
    } catch (error) {
      await notificationAsync(NotificationFeedbackType.Error)
      console.log(
        `Failed To Drop Application Data: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  return (
    <View style={styles.debugSection}>
      <View style={styles.debugRow}>
        <Pressable style={styles.debugButton} onPress={printApplications}>
          <Text style={styles.buttonText}>Print Applications</Text>
        </Pressable>
        <Pressable style={styles.debugButton} onPress={dropApplications}>
          <Text style={styles.buttonText}>Clear Table</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default DebugApplication

const styles = ScaledSheet.create({
  debugSection: {
    paddingInline: '3%',
    paddingBlock: '10@s',
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
