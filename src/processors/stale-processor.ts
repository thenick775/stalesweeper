import { Processor } from '../interfaces/processable'
import { DiscussionNode } from '../interfaces/graphql-outputs'
import { GraphqlProcessor } from './graphql-processor'
import { SimulationResult } from '../interfaces/simulation-result'
import { daysRemainingUntilStale, isBefore } from '../utils/time'
import { info } from '@actions/core'
import {
  colorDate,
  colorNumber,
  withDiscussionLogGroup,
  writeWithDiscussionNumber
} from '../utils/ansi-comments'

export class StaleDiscussionsValidator
  extends GraphqlProcessor
  implements Processor<DiscussionNode[], DiscussionNode[]>
{
  async process(
    discussions: DiscussionNode[]
  ): Promise<SimulationResult<DiscussionNode[]>> {
    info(
      `Stale if last updated before: ${colorDate(this.props.threshold.toISOString())}`
    )

    const staleDiscussions: DiscussionNode[] = []
    for (const discussion of discussions) {
      const evaluate = (): void => {
        writeWithDiscussionNumber(
          discussion.number,
          `Found this discussion last updated at: ${colorDate(discussion.updatedAt)}`
        )

        if (
          discussion.category.isAnswerable &&
          !this.props.closeUnanswered &&
          !discussion.isAnswered
        ) {
          writeWithDiscussionNumber(
            discussion.number,
            `Skipping because it is unanswered and close-unanswered is false`
          )

          return
        }

        if (
          this.props.category &&
          discussion.category.name !== this.props.category
        ) {
          writeWithDiscussionNumber(
            discussion.number,
            `Skipping because it is in category "${discussion.category.name}" (expected "${this.props.category}")`
          )

          return
        }

        const discussionUpdatedAt = new Date(discussion.updatedAt)
        if (!isBefore(discussionUpdatedAt, this.props.threshold)) {
          const daysRemaining = daysRemainingUntilStale(
            discussionUpdatedAt,
            this.props.threshold
          )
          writeWithDiscussionNumber(
            discussion.number,
            `└── Not stale yet, days before stale: ${colorNumber(daysRemaining)}`
          )

          return
        }

        const discussionLabels = discussion.labels?.nodes?.map(dl => dl.name)
        const exemptLabels = this.props.exemptLabels?.filter(label =>
          discussionLabels?.includes(label)
        )
        if (exemptLabels?.length) {
          writeWithDiscussionNumber(
            discussion.number,
            `└── Skipping this discussion because it contains exempt label(s): [${exemptLabels.map(el => `'${el}'`).join(', ')}]`
          )

          return
        }

        writeWithDiscussionNumber(discussion.number, `└── Marked as stale`)
        staleDiscussions.push(discussion)
      }

      await withDiscussionLogGroup(
        discussion.number,
        `Discussion #${discussion.number}`,
        evaluate
      )
    }

    return {
      result: staleDiscussions,
      success: true,
      debug: this.props.debug
    }
  }
}
