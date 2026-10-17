import ApplicationLog from '@/components/ApplicationLog'
import Separator from '@/components/Separator'
import { FONT_HEADER_TITLE } from '@/constants/text'
import { MAIN_BACKGROUND, PROFILE_BACKGROUND, PROFILE_TEXT } from '@/lib/constants'
import { StatusBar } from 'expo-status-bar'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ms, ScaledSheet } from 'react-native-size-matters'

export default function Index() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.index}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingBlockStart: insets.top }]}>
        <View style={styles.headerTextSection}>
          <Text style={styles.headerText}>Home</Text>
        </View>
        <Separator />
      </View>
      <View style={{ paddingInline: '3%', paddingBlock: ms(10) }}>
        <ApplicationLog />
      </View>
    </View>
  )
}

const styles = ScaledSheet.create({
  index: {
    flex: 1,
    backgroundColor: MAIN_BACKGROUND,
  },

  header: {
    backgroundColor: PROFILE_BACKGROUND,
  },

  headerTextSection: {
    paddingInline: '3%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBlockStart: '5@s',
    paddingBlockEnd: '10@s',
  },

  headerText: {
    fontSize: `${FONT_HEADER_TITLE}@ms`,
    fontWeight: 600,
    color: PROFILE_TEXT,
  },
})
