import { endGroup, info, setFailed, setOutput, startGroup } from '@actions/core'
import { context } from '@actions/github'
import { DiscussionFetcher } from './processors/discussion-processor'
import { DiscussionInputProcessor } from './processors/input-processor'
import { StaleDiscussionsValidator } from './processors/stale-processor'
import { HandleStaleDiscussions } from './processors/handle-stale-processor'
import { GitHubRateLimitFetcher } from './processors/ratelimit-processor'
import {
  writeNoMore,
  writeStatisticLine,
  writeStatisticsHeader
} from './utils/ansi-comments'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const input = new DiscussionInputProcessor()
  const props = await input.process()

  if (props.error) {
    setFailed(props.error)
    return
  }

  if (!props.result) {
    setFailed('Invalid input properties')
    return
  }

  const inputProps = props.result
  const repo = `${context.repo.owner}/${context.repo.repo}`

  // Keep details collapsible (like actions/stale "More details")
  if (inputProps.verbose) {
    startGroup('Inputs')
    info(`Repository: ${repo}`)
    info(`Dry run: ${inputProps.debug}`)
    info(`Threshold: ${inputProps.threshold.toUTCString()}`)
    if (inputProps.category) info(`Category: ${inputProps.category}`)
    info(`Close unanswered: ${inputProps.closeUnanswered}`)
    info(`Close reason: ${inputProps.closeReason}`)
    endGroup()
  }

  const rateLimit = new GitHubRateLimitFetcher(inputProps)

  const beforeRateLimit = await rateLimit.process()
  if (beforeRateLimit.error) {
    setFailed(beforeRateLimit.error)
    return
  }

  const fetcher = new DiscussionFetcher(inputProps)
  if (inputProps.verbose) startGroup('Fetching discussions')
  const discussions = await fetcher.process({
    owner: context.repo.owner,
    repo: context.repo.repo
  })
  if (inputProps.verbose) endGroup()

  if (discussions.error) {
    setFailed(discussions.error)
    return
  }

  const staleValidator = new StaleDiscussionsValidator(inputProps)
  if (inputProps.verbose) startGroup('Determining stale discussions')
  const staleDiscussions = await staleValidator.process(discussions.result)
  if (inputProps.verbose) endGroup()

  if (staleDiscussions.error) {
    setFailed(staleDiscussions.error)
    return
  }

  const staleHandler = new HandleStaleDiscussions(inputProps)
  if (inputProps.verbose) startGroup('Handling stale discussions')
  const handledStaleDiscussions = await staleHandler.process({
    discussions: staleDiscussions.result,
    owner: context.repo.owner,
    repo: context.repo.repo
  })
  if (inputProps.verbose) endGroup()

  if (handledStaleDiscussions.error) {
    setFailed(handledStaleDiscussions.error)
    return
  }

  const afterRateLimit = await rateLimit.process()
  if (afterRateLimit.error) {
    setFailed(afterRateLimit.error)
    return
  }

  const fetchedCount = discussions.result.length
  const processedCount = handledStaleDiscussions.result.length
  const operationsPerformed = inputProps.debug ? 0 : processedCount

  if (processedCount === 0) {
    writeNoMore('discussions')
  } else if (inputProps.debug) {
    info('Dry run enabled: no comments/closures were performed.')
  }

  writeStatisticsHeader()
  writeStatisticLine('Processed discussions', processedCount)
  writeStatisticLine('Fetched items', fetchedCount)
  writeStatisticLine('Operations performed', operationsPerformed)

  const before = beforeRateLimit.result.data.rateLimit
  const after = afterRateLimit.result.data.rateLimit
  if (before.limit >= 0 && before.remaining >= 0) {
    const used = before.limit - before.remaining
    info(`Github API rate used: ${used}`)
  }
  if (after.remaining >= 0) {
    const reset = after.resetAt
      ? `; reset at: ${new Date(after.resetAt).toString()}`
      : ''
    info(`Github API rate remaining: ${after.remaining}${reset}`)
  }

  setOutput('stale-discussions', handledStaleDiscussions.result)
}
