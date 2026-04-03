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
import {
  withDiscussionLogGroup,
  writeWithDiscussionNumber
} from '../utils/ansi-comments'
import { delay } from '../utils/delay'

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
      await delay(this.props.rateLimitDelayMs)

      const act = async (): Promise<void> => {
        writeWithDiscussionNumber(
          discussion.number,
          `Adding comment and closing discussion #${discussion.number}`
        )

        if (this.props.debug) {
          writeWithDiscussionNumber(
            discussion.number,
            `└── [dry-run] Would comment and close this discussion`
          )

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
        } else {
          writeWithDiscussionNumber(
            discussion.number,
            `└── Skipping comment (no message)`
          )
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
        await withDiscussionLogGroup(
          discussion.number,
          `Discussion #${discussion.number}`,
          act
        )
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
