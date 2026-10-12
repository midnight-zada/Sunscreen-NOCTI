import { InsertApplication } from '@/lib/application'

export const getUserSunscreenData = (userId: string): InsertApplication[] => [
  {
    user_id: userId,
    user_sunscreen_id: 1,
    uvi_high: null,
    uvi_low: null,
    uvi_average: null,
    is_water_exposed: 0,
    latitude: null,
    longitude: null,
    applied_at: new Date().toISOString(),
  },
]
