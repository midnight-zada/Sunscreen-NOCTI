import { useUserSunscreens } from '@/context/UserSunscreenContext'
import { PROFILE_SCREEN_BG_COLOR } from '@/lib/constants'
import { formatDuration, UserSunscreen } from '@/lib/userSunscreen'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { memo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ms, ScaledSheet } from 'react-native-size-matters'

interface SunscreenCardProps {
  sunscreen: UserSunscreen
  isFocused: boolean
}

const SunscreenCard = memo(({ sunscreen, isFocused }: SunscreenCardProps) => {
  const { toggleFavorite } = useUserSunscreens()

  const [isWaterApplication, setIsWaterApplication] = useState(false)
  const isFavorite = sunscreen.is_favorite === 1

  const applySunscreen = async () => {}

  const showOptions = () => {}

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isFocused ? PROFILE_SCREEN_BG_COLOR : undefined,
        },
      ]}
    >
      <Image
        source={
          sunscreen.image_uri
            ? { uri: sunscreen.image_uri }
            : require('../assets/images/placeholder.jpg')
        }
        style={styles.image}
      />
      <View style={styles.infoSection}>
        <View style={styles.headerSection}>
          <Text style={styles.nameText} numberOfLines={1}>
            {sunscreen.nickname !== null ? sunscreen.nickname : sunscreen.name}
          </Text>
          <View style={styles.badgeSection}>
            <Pressable onPress={() => toggleFavorite(sunscreen.id)} hitSlop={4}>
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={ms(22)}
                color={isFavorite ? '#ffed4c' : '#9a9a9a'}
              />
            </Pressable>
            <Pressable onPress={showOptions} hitSlop={4}>
              <Ionicons name="ellipsis-vertical-outline" size={ms(22)} color="#9a9a9a" />
            </Pressable>
          </View>
        </View>
        <View style={styles.seperator} />
        <View style={styles.bodySection}>
          <View style={styles.pinSection}>
            <Text style={styles.pinText}>SPF {sunscreen.spf}</Text>
            <View style={styles.pinSeparator} />
            <Text
              style={[
                styles.pinText,
                {
                  opacity: !isWaterApplication ? 1 : 0.4,
                },
              ]}
            >
              {formatDuration(sunscreen.duration)}
            </Text>
            <View style={styles.pinSeparator} />
            <Text
              style={[
                styles.pinText,
                {
                  opacity:
                    isWaterApplication || sunscreen.water_duration === null ? 1 : 0.4,
                },
              ]}
            >
              {sunscreen.water_duration
                ? formatDuration(sunscreen.water_duration)
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.buttonSection}>
            <Pressable
              style={[
                styles.button,
                styles.toggleButton,
                {
                  backgroundColor: isFocused ? '#ececec' : PROFILE_SCREEN_BG_COLOR,
                },
              ]}
              onPress={() => {
                if (sunscreen.water_duration !== null)
                  setIsWaterApplication(!isWaterApplication)
              }}
            >
              <Ionicons
                name="sunny-outline"
                size={ms(22)}
                style={{
                  opacity:
                    !isWaterApplication && sunscreen.water_duration !== null ? 1 : 0.4,
                }}
                color="#1f1f1f"
              />
              <View
                style={[
                  styles.toggleDivider,
                  { opacity: sunscreen.water_duration !== null ? 1 : 0.4 },
                ]}
              />
              <Ionicons
                name="water-outline"
                size={ms(22)}
                style={{
                  opacity:
                    isWaterApplication && sunscreen.water_duration !== null ? 1 : 0.4,
                }}
                color="#1f1f1f"
              />
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.applyButton,
                {
                  backgroundColor: isFocused ? '#ececec' : PROFILE_SCREEN_BG_COLOR,
                },
              ]}
              onPress={applySunscreen}
            >
              <Text style={styles.applyText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  )
})

export default SunscreenCard

const styles = ScaledSheet.create({
  card: {
    flexDirection: 'row',
    gap: '10@s',
    paddingBlock: '6@s',
  },

  image: {
    width: '105@s',
    aspectRatio: 1,
    borderRadius: 10,
    marginInlineStart: '10@s',
    backgroundColor: '#fff',
    borderColor: '#c5c5c5',
    borderWidth: 2,
  },

  infoSection: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginInlineEnd: '10@s',
  },

  nameText: {
    flex: 1,
    fontSize: '18@ms',
    color: '#1f1f1f',
    fontWeight: 600,
  },

  badgeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '7@ms',
    paddingInlineStart: '6@ms',
  },

  seperator: {
    width: '100%',
    height: 2,
    marginBlockStart: '6@s',
    marginBlockEnd: '4@s',
    backgroundColor: '#c5c5c5',
    marginInlineEnd: '-3%',
  },

  bodySection: {
    flex: 1,
    paddingBlockStart: '3@ms',
    marginInlineEnd: '10@s',
    gap: '10@s',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  pinSection: {
    width: '90@ms',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  pinText: {
    fontSize: '14@ms',
    fontWeight: 600,
    color: '#1f1f1f',
  },

  pinSeparator: {
    height: 1,
    width: '100%',
    backgroundColor: '#c5c5c5',
  },

  buttonSection: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '6@s',
  },

  button: {
    flex: 1,
    width: '100%',
    borderRadius: '8@ms',
    backgroundColor: PROFILE_SCREEN_BG_COLOR,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingInline: '10@s',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 2,
  },

  toggleButton: {
    justifyContent: 'space-evenly',
    gap: '10@s',
  },

  applyButton: {
    justifyContent: 'center',
  },

  toggleDivider: {
    width: 1.5,
    height: '60%',
    backgroundColor: '#1f1f1f',
  },

  applyText: {
    fontSize: '18@ms',
    fontWeight: 600,
    textAlign: 'center',
    color: '#1f1f1f',
  },
})
