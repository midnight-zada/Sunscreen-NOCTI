const DEBUG = true

const border = (color: string) => (DEBUG ? { borderWidth: 1, borderColor: color } : {})

export const debug = {
  red: border("red"),
  green: border("green"),
  blue: border("blue"),
  yellow: border("yellow"),
  orange: border("orange"),
  purple: border("purple"),
}
