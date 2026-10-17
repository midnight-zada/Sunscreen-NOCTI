import { useCurrentLocation } from '@/hooks/useCurrentLocation'
import { FONT_HEADER, MAIN_BACKGROUND, PROFILE_ICON, PROFILE_TEXT } from '@/lib/constants'
import { Ionicons } from '@expo/vector-icons'
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ms, ScaledSheet } from 'react-native-size-matters'
import Separator from './Separator'

export interface MapCoordinate {
  latitude: number
  longitude: number
}

interface MapLocationPickerProps {
  isFocused: boolean
  setIsFocused: Dispatch<SetStateAction<boolean>>
  initialLocation: MapCoordinate | null
  onConfirm: (location: MapCoordinate) => void
}

const DEFAULT_DELTA = 0.05

const DEFAULT_REGION: Region = {
  latitude: 34.011194,
  longitude: -118.491861,
  latitudeDelta: DEFAULT_DELTA,
  longitudeDelta: DEFAULT_DELTA,
}

const MapLocationPicker = ({
  isFocused,
  setIsFocused,
  initialLocation,
  onConfirm,
}: MapLocationPickerProps) => {
  const insets = useSafeAreaInsets()
  const opacity = useRef(new Animated.Value(0)).current
  const [modalVisible, setModalVisible] = useState(isFocused)
  const [selected, setSelected] = useState<MapCoordinate | null>(initialLocation)
  const { getCurrentLocation, isLocating } = useCurrentLocation()
  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    if (isFocused) {
      setSelected(initialLocation)
      setModalVisible(true)
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => setModalVisible(false))
    }
  }, [isFocused, initialLocation, opacity])

  const close = useCallback(() => setIsFocused(false), [setIsFocused])

  const confirm = useCallback(() => {
    if (!selected) return

    onConfirm(selected)
    setIsFocused(false)
  }, [selected, onConfirm, setIsFocused])

  const onMapPress = useCallback((event: MapPressEvent) => {
    setSelected(event.nativeEvent.coordinate)
  }, [])

  const setToCurrentLocation = useCallback(async () => {
    const coordinate = await getCurrentLocation()
    if (!coordinate) return

    setSelected(coordinate)
    mapRef.current?.animateToRegion(
      { ...coordinate, latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA },
      300
    )
  }, [getCurrentLocation])

  const initialRegion: Region = initialLocation
    ? { ...initialLocation, latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA }
    : DEFAULT_REGION

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onShow={() => {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start()
      }}
      onRequestClose={close}
    >
      <Animated.View
        style={[styles.container, { opacity, paddingBlockStart: insets.top }]}
      >
        <View style={styles.header}>
          <Pressable onPress={close} hitSlop={10}>
            <Text style={styles.headerText}>Cancel</Text>
          </Pressable>
          <Text style={[styles.headerText, styles.headerTitle]}>Set Location</Text>
          <Pressable onPress={confirm} disabled={!selected} hitSlop={10}>
            <Text
              style={[
                styles.headerText,
                styles.headerTitle,
                !selected && styles.confirmTextDisabled,
              ]}
            >
              Done
            </Text>
          </Pressable>
        </View>
        <Separator />
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            onPress={onMapPress}
          >
            {selected && (
              <Marker
                coordinate={selected}
                draggable
                onDragEnd={(event) => setSelected(event.nativeEvent.coordinate)}
              />
            )}
          </MapView>
          <Pressable
            style={[styles.locateButton, { bottom: insets.bottom + ms(16) }]}
            onPress={setToCurrentLocation}
            disabled={isLocating}
            hitSlop={10}
          >
            <Ionicons
              name="locate"
              size={ms(22)}
              color={isLocating ? PROFILE_ICON : PROFILE_TEXT}
            />
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  )
}

export default MapLocationPicker

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: MAIN_BACKGROUND,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingInline: '4%',
    paddingBlockStart: '5@s',
    paddingBlockEnd: '10@s',
  },

  headerText: {
    fontSize: `${FONT_HEADER}@ms`,
    color: PROFILE_TEXT,
  },

  headerTitle: {
    fontWeight: 600,
  },

  confirmTextDisabled: {
    opacity: 0.4,
  },

  mapContainer: {
    flex: 1,
  },

  locateButton: {
    position: 'absolute',
    right: '16@s',
    width: '44@s',
    height: '44@s',
    borderRadius: '18@ms',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
