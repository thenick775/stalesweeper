export function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime()
}

export function daysRemainingUntilStale(
  updatedAt: Date,
  threshold: Date,
  now = new Date()
): number {
  const msPerDay = 86_400_000
  const staleAfterDays = Math.floor(
    (now.getTime() - threshold.getTime()) / msPerDay
  )

  return Math.max(
    0,
    staleAfterDays -
      Math.floor((now.getTime() - updatedAt.getTime()) / msPerDay)
  )
}
