import { Processor } from '../interfaces/processable'
import { DiscussionNode } from '../interfaces/graphql-outputs'
import { GraphqlProcessor } from './graphql-processor'
import { SimulationResult } from '../interfaces/simulation-result'
import { isBefore } from '../utils/time'
import { info } from '@actions/core'
import { withItemLogGroup } from '../utils/ansi-comments'

export class StaleDiscussionsValidator
  extends GraphqlProcessor
  implements Processor<DiscussionNode[], DiscussionNode[]>
{
  async process(
    discussions: DiscussionNode[]
  ): Promise<SimulationResult<DiscussionNode[]>> {
    if (this.props.verbose) {
      info(
        `Comparing discussion dates with ${this.props.threshold.toUTCString()}, to determine stale state`
      )
    }

    const staleDiscussions: DiscussionNode[] = []
    for (const discussion of discussions) {
      const evaluate = (): void => {
        if (this.props.verbose) {
          info(
            `  [#${discussion.number}] Found this discussion last updated at: ${discussion.updatedAt}`
          )
        }

        if (
          discussion.category.isAnswerable &&
          !this.props.closeUnanswered &&
          !discussion.isAnswered
        ) {
          if (this.props.verbose) {
            info(
              `  [#${discussion.number}] Skipping because it is unanswered and close-unanswered is false`
            )
          }
          return
        }

        if (
          this.props.category &&
          discussion.category.name !== this.props.category
        ) {
          if (this.props.verbose) {
            info(
              `  [#${discussion.number}] Skipping because it is in category "${discussion.category.name}" (expected "${this.props.category}")`
            )
          }
          return
        }

        const discussionUpdatedAt = new Date(discussion.updatedAt)
        if (!isBefore(discussionUpdatedAt, this.props.threshold)) {
          if (this.props.verbose) {
            info(`  [#${discussion.number}] └── Not stale yet`)
          }
          return
        }

        if (this.props.verbose) {
          info(`  [#${discussion.number}] └── Marked as stale`)
        }
        staleDiscussions.push(discussion)
      }

      if (this.props.verbose) {
        await withItemLogGroup(
          discussion.number,
          `Discussion #${discussion.number}`,
          evaluate
        )
      } else {
        evaluate()
      }
    }

    return {
      result: staleDiscussions,
      success: true,
      debug: this.props.debug
    }
  }
}
