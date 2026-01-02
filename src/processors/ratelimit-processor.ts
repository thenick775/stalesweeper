import { info } from '@actions/core'
import { GraphqlProcessor } from './graphql-processor'
import { Processor } from '../interfaces/processable'
import {
  GitHubRateLimit,
  WrappedQueryResponse
} from '../interfaces/graphql-outputs'
import { buildFetchRateLimitQuery } from '../query/ratelimit-queries'
import { SimulationResult } from '../interfaces/simulation-result'

export class GitHubRateLimitFetcher
  extends GraphqlProcessor
  implements Processor<undefined, GitHubRateLimit>
{
  async process(): Promise<SimulationResult<GitHubRateLimit>> {
    if (this.props.verbose) {
      info('Fetching rate limit')
    }

    if (this.props.debug) {
      return {
        result: { data: { rateLimit: { limit: -1, remaining: -1 } } },
        success: true,
        debug: true
      }
    }

    const response: WrappedQueryResponse<GitHubRateLimit> =
      await this.executeQuery(buildFetchRateLimitQuery())
    if (response.error) {
      return {
        result: { data: { rateLimit: { limit: -1, remaining: -1 } } },
        success: false,
        debug: this.props.debug,
        error: response.error
      }
    }

    if (!response.data) {
      return {
        result: { data: { rateLimit: { limit: -1, remaining: -1 } } },
        success: false,
        debug: this.props.debug,
        error: new Error('Missing data in rate limit response')
      }
    }

    return {
      result: response.data,
      success: true,
      debug: this.props.debug
    }
  }
}
