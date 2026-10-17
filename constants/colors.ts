export const NAVBAR_COLOR = '#0C1014'
export const SEPARATOR_LIGHT_COLOR = '#4e5157'
export const SEPARATOR_WHITE_COLOR = '#5a5c5e'

export const SUCCESS_GREEN = '#29b71c'
export const ERROR_RED = '#ac1515'

export const NAVBAR_COLOR_T = 'rgba(12, 16, 20, 0.55)'

export const UVI_UNKNOWN_COLOR = '#2f3237'
export const UVI_LOW_COLOR = '#23ac0e'
export const UVI_MODERATE_COLOR = '#f6f600'
export const UVI_HIGH_COLOR = '#ff910a'
export const UVI_VERY_HIGH_COLOR = '#f20b0b'
export const UVI_EXTREME_COLOR = '#a812ff'

export const getUviColor = (uvi: number | null): string => {
  if (uvi === null || uvi === 0) return UVI_UNKNOWN_COLOR
  if (uvi < 3) return SUCCESS_GREEN
  if (uvi < 6) return UVI_MODERATE_COLOR
  if (uvi < 8) return UVI_HIGH_COLOR
  if (uvi < 11) return UVI_VERY_HIGH_COLOR
  return UVI_EXTREME_COLOR
}
