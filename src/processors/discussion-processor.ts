import { info } from '@actions/core'
import { buildFetchAllDiscussionsQuery } from '../query/discussion-queries'
import {
  DiscussionNode,
  DiscussionsQueryResponse,
  WrappedQueryResponse
} from '../interfaces/graphql-outputs'
import { Processor } from '../interfaces/processable'
import { SimulationResult } from '../interfaces/simulation-result'
import { GraphqlProcessor } from './graphql-processor'

export interface DiscussionFetcherProps {
  owner: string
  repo: string
}

export class DiscussionFetcher
  extends GraphqlProcessor
  implements Processor<DiscussionFetcherProps, DiscussionNode[]>
{
  async process(
    input: DiscussionFetcherProps
  ): Promise<SimulationResult<DiscussionNode[]>> {
    let discussions: DiscussionNode[] = []
    let cursor: string | null = null

    while (true) {
      if (this.props.verbose) {
        info(
          `Fetching discussions page for ${input.owner}/${input.repo}, with cursor ${cursor}`
        )
      }

      if (this.props.debug) {
        break
      }

      const response: WrappedQueryResponse<DiscussionsQueryResponse> =
        await this.executeQuery(
          buildFetchAllDiscussionsQuery(input.owner, input.repo, cursor)
        )
      if (response.error) {
        return {
          result: [],
          success: false,
          debug: this.props.debug,
          error: response.error
        }
      }

      if (!response.data) {
        return {
          result: [],
          success: false,
          debug: this.props.debug,
          error: new Error('Missing data in discussions response')
        }
      }

      const discussionsResponse = response.data.repository.discussions
      discussions = discussions.concat(discussionsResponse.nodes)
      if (!discussionsResponse.pageInfo.hasNextPage) {
        break
      }
      cursor = discussionsResponse.pageInfo.endCursor
    }

    return {
      result: discussions,
      success: true,
      debug: this.props.debug
    }
  }
}
