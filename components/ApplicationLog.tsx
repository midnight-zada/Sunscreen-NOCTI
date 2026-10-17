import { FONT_HEADER, FONT_SUBTEXT, FONT_TEXT } from '@/constants/text'
import { useApplications } from '@/context/ApplicationContext'
import { useUserSunscreens } from '@/context/UserSunscreenContext'
import { PROFILE_BACKGROUND, PROFILE_ICON, SEPARATOR, WATER_COLOR } from '@/lib/constants'
import { formatDuration } from '@/lib/userSunscreen'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { ms, scale, ScaledSheet } from 'react-native-size-matters'
import Separator from './Separator'

const ApplicationLog = () => {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false)
  const { applications, hasLoaded } = useApplications()
  const { getById } = useUserSunscreens()

  return (
    <View style={styles.applicationLogSection}>
      <View style={styles.buttonSection}>
        <Pressable
          style={styles.button}
          onPress={() => setIsApplicationOpen((prev) => !prev)}
        >
          <Text style={styles.buttonText}>Application Activity</Text>
          <Ionicons
            name={isApplicationOpen ? 'chevron-up' : 'chevron-down'}
            size={ms(FONT_HEADER + 7)}
            color={PROFILE_BACKGROUND}
          />
        </Pressable>

        {isApplicationOpen && (
          <>
            <View style={{ paddingInline: '3%' }}>
              <Separator />
            </View>
            <ScrollView style={styles.listSection}>
              {!hasLoaded ? null : applications.length === 0 ? (
                <Text style={styles.emptyText}>No applications logged yet</Text>
              ) : (
                applications.map((application, index) => {
                  const sunscreen = getById(application.user_sunscreen_id)

                  return (
                    <View key={application.id}>
                      {index > 0 && <Separator scaleMargin={12} />}
                      <View
                        style={[
                          styles.applicationRow,
                          index === 0 && { paddingBlockStart: scale(12) },
                          index === applications.length - 1 && {
                            paddingBlockEnd: scale(12),
                          },
                        ]}
                      >
                        <Text style={styles.applicationName} numberOfLines={1}>
                          {sunscreen?.is_archived ? '[Archived] ' : null}
                          {sunscreen
                            ? (sunscreen.nickname ?? sunscreen.name)
                            : 'Unknown Sunscreen'}
                        </Text>
                        <View style={styles.applicationMeta}>
                          {application.is_water_exposed === 1 && (
                            <Ionicons
                              name="water-outline"
                              size={ms(14)}
                              color={WATER_COLOR}
                            />
                          )}
                          <Text style={styles.applicationTime}>
                            {sunscreen?.water_duration && application.is_water_exposed
                              ? formatDuration(sunscreen.water_duration)
                              : sunscreen && formatDuration(sunscreen.duration)}
                          </Text>
                          <View style={styles.verticalSeparator} />
                          <Text style={styles.applicationTime}>
                            {new Date(application.applied_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )
                })
              )}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  )
}

export default ApplicationLog

const styles = ScaledSheet.create({
  applicationLogSection: {
    backgroundColor: '#d1d4d6',
    borderWidth: 2,
    borderColor: PROFILE_ICON,
    borderRadius: '5@ms',
  },

  buttonSection: {},

  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingInline: '10@s',
    paddingBlock: '5@s',
  },

  buttonText: {
    fontSize: FONT_HEADER,
  },

  listSection: {
    paddingInline: '10@s',
    maxHeight: '400@s',
  },

  emptyText: {
    paddingBlock: '10@s',
    fontSize: `${FONT_SUBTEXT}@ms`,
    color: SEPARATOR,
  },

  applicationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10@s',
  },

  applicationName: {
    flex: 1,
    fontSize: `${FONT_TEXT}@ms`,
    fontWeight: 500,
    color: PROFILE_BACKGROUND,
  },

  applicationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
  },

  applicationTime: {
    fontSize: `${FONT_SUBTEXT}@ms`,
    color: SEPARATOR,
  },

  verticalSeparator: {
    width: 1,
    height: `${FONT_TEXT}@ms`,
    backgroundColor: '#000',
  },
})
