import { MapCoordinate } from '@/components/MapLocationPicker'
import * as Location from 'expo-location'
import { useCallback, useRef, useState } from 'react'

export function useCurrentLocation() {
  const [isLocating, setIsLocating] = useState(false)
  const isFetching = useRef(false)

  const getCurrentLocation = useCallback(async (): Promise<MapCoordinate | null> => {
    if (isFetching.current) return null
    isFetching.current = true

    setIsLocating(true)

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return null

      const position = await Location.getCurrentPositionAsync({})
      
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
    } catch (error) {
      console.error(
        `Failed To Get Current Location: ${error instanceof Error ? error.message : String(error)}`
      )
      return null
    } finally {
      isFetching.current = false
      setIsLocating(false)
    }
  }, [])

  return { getCurrentLocation, isLocating }
}
