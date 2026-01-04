import { endGroup, info, startGroup } from '@actions/core'

type Message = string | number | boolean

const ANSI = {
  reset: '\x1b[0m',
  whiteBright: '\x1b[97m',
  yellowBright: '\x1b[93m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
} as const

type StyleKey = keyof typeof ANSI

const format =
  (style: Exclude<StyleKey, 'reset'>) =>
  (message: Readonly<Message>): string =>
    `${ANSI[style]}${message}${ANSI.reset}`

const whiteBright = format('whiteBright')
const yellowBright = format('yellowBright')
const cyan = format('cyan')
const green = format('green')
const bold = format('bold')
const red = format('red')

export const withLogGroup = async (
  title: string,
  fn: () => Promise<void> | void
): Promise<void> => {
  startGroup(title)
  try {
    await fn()
  } finally {
    endGroup()
  }
}

export const withItemLogGroup = async (
  number: number,
  title: string,
  fn: () => Promise<void> | void
): Promise<void> => withLogGroup(`${red(`[#${number}]`)} ${title}`, fn)

export const writeNoMore = (kind: string): void => {
  info(whiteBright(green(`No more ${kind} found to process. Exiting...`)))
}

export const writeStatisticsHeader = (): void => {
  info(whiteBright(yellowBright(bold('Statistics:'))))
}

export const writeStatisticLine = (
  label: string,
  value: number | string
): void => {
  info(whiteBright(`${label}: ${cyan(value)}`))
}
