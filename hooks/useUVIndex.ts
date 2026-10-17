import { MapCoordinate } from '@/components/MapLocationPicker'
import { useCallback, useRef, useState } from 'react'

const UVI_API_URL = 'https://api.open-meteo.com/v1/forecast'
const HOUR_MS = 60 * 60 * 1000

export type LocationVisit = {
  coordinate: MapCoordinate
  start: Date
  end: Date
}

export type UVIndexStats = {
  low: number
  high: number
  average: number
}

type HourlyUVReading = {
  time: Date
  uvIndex: number | null
}

function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function fetchHourlyUVI(visit: LocationVisit): Promise<HourlyUVReading[] | null> {
  try {
    const url =
      `${UVI_API_URL}?latitude=${visit.coordinate.latitude}&longitude=${visit.coordinate.longitude}&hourly=uv_index` +
      `&timezone=UTC&start_date=${toUtcDateString(visit.start)}&end_date=${toUtcDateString(visit.end)}`
    const response = await fetch(url)

    if (!response.ok) throw new Error(`Request failed with status ${response.status}`)

    const data = await response.json()
    const times = data?.hourly?.time
    const values = data?.hourly?.uv_index

    if (!Array.isArray(times) || !Array.isArray(values)) return null

    return times.map((time: string, index: number) => ({
      time: new Date(`${time}Z`),
      uvIndex: typeof values[index] === 'number' ? values[index] : null,
    }))
  } catch (error) {
    console.error(
      `Failed To Get Hourly UVI: ${error instanceof Error ? error.message : String(error)}`
    )
    return null
  }
}

export function useUVIndex() {
  const [isLoadingUVI, setIsLoadingUVI] = useState(false)
  const requestId = useRef(0)

  const [isLoadingUVIStats, setIsLoadingUVIStats] = useState(false)
  const isFetchingStats = useRef(false)

  const getUVIndex = useCallback(
    async (coordinate: MapCoordinate, time: Date): Promise<number | null> => {
      const id = ++requestId.current
      setIsLoadingUVI(true)

      try {
        const readings = await fetchHourlyUVI({ coordinate, start: time, end: time })
        if (!readings) return null

        const targetHour = Math.floor(time.getTime() / HOUR_MS) * HOUR_MS
        const reading = readings.find((r) => r.time.getTime() === targetHour)

        return reading?.uvIndex ?? null
      } finally {
        if (id === requestId.current) setIsLoadingUVI(false)
      }
    },
    []
  )

  const getUVIndexStats = useCallback(
    async (visits: LocationVisit[]): Promise<UVIndexStats | null> => {
      if (visits.length === 0) return null

      if (isFetchingStats.current) return null
      isFetchingStats.current = true

      setIsLoadingUVIStats(true)

      try {
        const results = await Promise.all(visits.map(fetchHourlyUVI))

        let low = Infinity
        let high = -Infinity
        let weightedSum = 0
        let totalWeight = 0

        visits.forEach((visit, index) => {
          const uvReadings = results[index]
          if (!uvReadings) return

          for (const { time, uvIndex } of uvReadings) {
            if (uvIndex === null) continue

            low = Math.min(low, uvIndex)
            high = Math.max(high, uvIndex)

            const timeStart = time.getTime()
            const overlapMS =
              Math.min(visit.end.getTime(), timeStart + HOUR_MS) -
              Math.max(visit.start.getTime(), timeStart)
            if (overlapMS <= 0) continue

            const weight = overlapMS / HOUR_MS
            weightedSum += uvIndex * weight
            totalWeight += weight
          }
        })

        if (totalWeight === 0 || low === Infinity) return null

        return { low, high, average: weightedSum / totalWeight }
      } finally {
        isFetchingStats.current = false
        setIsLoadingUVIStats(false)
      }
    },
    []
  )

  return { getUVIndex, isLoadingUVI, getUVIndexStats, isLoadingUVIStats }
}
