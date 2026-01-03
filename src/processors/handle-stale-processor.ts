import {
  DiscussionNode,
  DiscussionsQueryResponse,
  WrappedQueryResponse
} from '../interfaces/graphql-outputs'
import { GraphqlProcessor } from './graphql-processor'
import { Processor } from '../interfaces/processable'
import { SimulationResult } from '../interfaces/simulation-result'
import {
  buildCloseDiscussionQuery,
  buildDiscussionAddCommentQuery
} from '../query/discussion-queries'
import { info } from '@actions/core'
import { withItemLogGroup } from '../utils/ansi-comments'

export interface HandleStaleDiscussionsProps {
  discussions: DiscussionNode[]
  owner: string
  repo: string
}

export class HandleStaleDiscussions
  extends GraphqlProcessor
  implements Processor<HandleStaleDiscussionsProps, DiscussionNode[]>
{
  async process(
    input: HandleStaleDiscussionsProps
  ): Promise<SimulationResult<DiscussionNode[]>> {
    for (const discussion of input.discussions) {
      const act = async (): Promise<void> => {
        if (this.props.verbose) {
          info(
            `  [#${discussion.number}] Adding comment and closing discussion #${discussion.number}`
          )
        }

        if (this.props.debug) {
          if (this.props.verbose) {
            info(
              `  [#${discussion.number}] └── [dry-run] Would comment and close this discussion`
            )
          }
          return
        }

        if (this.props.message && this.props.message !== '') {
          const commentResponse: WrappedQueryResponse<DiscussionsQueryResponse> =
            await this.executeQuery(
              buildDiscussionAddCommentQuery(discussion.id, this.props.message)
            )
          if (commentResponse.error) {
            throw commentResponse.error
          }
        } else if (this.props.verbose) {
          info(`  [#${discussion.number}] └── Skipping comment (no message)`)
        }

        const closeResponse: WrappedQueryResponse<DiscussionsQueryResponse> =
          await this.executeQuery(
            buildCloseDiscussionQuery(discussion.id, this.props.closeReason)
          )
        if (closeResponse.error) {
          throw closeResponse.error
        }
      }

      try {
        if (this.props.verbose) {
          await withItemLogGroup(
            discussion.number,
            `Discussion #${discussion.number}`,
            act
          )
        } else {
          await act()
        }
      } catch (err) {
        return {
          result: [],
          success: false,
          debug: this.props.debug,
          error: err as Error
        }
      }
    }

    return {
      result: input.discussions,
      success: true,
      debug: this.props.debug
    }
  }
}
