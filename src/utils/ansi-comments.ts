import { endGroup, info, startGroup } from '@actions/core'
import styles, { type ForegroundColor, type Modifier } from 'ansi-styles'

type Message = string | number | boolean

type Style = keyof Modifier | keyof ForegroundColor

const format =
  (style: Style) =>
  (message: Readonly<Message>): string =>
    `${styles[style].open}${message}${styles[style].close}`

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

export const withDiscussionLogGroup = async (
  number: number,
  title: string,
  fn: () => Promise<void> | void
): Promise<void> => withLogGroup(`${red(`[#${number}]`)} ${title}`, fn)

export const writeWithDiscussionNumber = (
  number: number,
  message: string
): void => {
  info(whiteBright(red(`${red(`[#${number}]`)} ${message}`)))
}

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

export const colorDate = (dateString: string): string => cyan(dateString)
export const colorNumber = (number: number): string => cyan(number)
