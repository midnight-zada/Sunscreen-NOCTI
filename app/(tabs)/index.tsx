import { MAIN_BACKGROUND } from '@/lib/constants'
import { Text, View } from 'react-native'

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: MAIN_BACKGROUND,
      }}
    >
      <Text>Index screen</Text>
    </View>
  )
}
