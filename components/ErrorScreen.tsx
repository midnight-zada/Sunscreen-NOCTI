import { RED_ORANGE } from '@/lib/constants'
import { Text, View } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

const ErrorScreen = () => {
  return (
    <View style={styles.errorScreen}>
      <Text style={styles.errorText}>Error</Text>
    </View>
  )
}

export default ErrorScreen

const styles = ScaledSheet.create({
  errorScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    fontSize: '22@ms',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: RED_ORANGE,
  },
})
