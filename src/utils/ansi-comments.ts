import { endGroup, info, startGroup } from '@actions/core'

const ANSI = {
  reset: '\x1b[39m',
  white: '\x1b[97m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  boldOn: '\x1b[1m',
  boldOff: '\x1b[22m'
} as const

const wrap = (s: string): string =>
  `${ANSI.white}${s}${ANSI.reset}${ANSI.reset}`

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
): Promise<void> => withLogGroup(`[#${number}] ${title}`, fn)

export const writeNoMore = (kind: string): void => {
  info(
    wrap(
      `${ANSI.green}No more ${kind} found to process. Exiting...${ANSI.reset}`
    )
  )
}

export const writeStatisticsHeader = (): void => {
  info(
    `${ANSI.white}${ANSI.yellow}${ANSI.boldOn}Statistics:${ANSI.boldOff}${ANSI.reset}${ANSI.reset}`
  )
}

export const writeStatisticLine = (
  label: string,
  value: number | string
): void => {
  info(wrap(`${label}: ${ANSI.cyan}${value}${ANSI.reset}`))
}
