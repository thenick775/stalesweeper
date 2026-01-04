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
    if (this.props.verbose) {
      info(
        `Stale if last updated before: ${colorDate(this.props.threshold.toUTCString())}`
      )
    }

    const staleDiscussions: DiscussionNode[] = []
    for (const discussion of discussions) {
      const evaluate = (): void => {
        if (this.props.verbose) {
          writeWithDiscussionNumber(
            discussion.number,
            `Found this discussion last updated at: ${colorDate(discussion.updatedAt)}`
          )
        }

        if (
          discussion.category.isAnswerable &&
          !this.props.closeUnanswered &&
          !discussion.isAnswered
        ) {
          if (this.props.verbose) {
            writeWithDiscussionNumber(
              discussion.number,
              `Skipping because it is unanswered and close-unanswered is false`
            )
          }
          return
        }

        if (
          this.props.category &&
          discussion.category.name !== this.props.category
        ) {
          if (this.props.verbose) {
            writeWithDiscussionNumber(
              discussion.number,
              `Skipping because it is in category "${discussion.category.name}" (expected "${this.props.category}")`
            )
          }
          return
        }

        const discussionUpdatedAt = new Date(discussion.updatedAt)
        if (!isBefore(discussionUpdatedAt, this.props.threshold)) {
          if (this.props.verbose) {
            const daysRemaining = daysRemainingUntilStale(
              discussionUpdatedAt,
              this.props.threshold
            )
            writeWithDiscussionNumber(
              discussion.number,
              `└── Not stale yet, days before stale: ${colorNumber(daysRemaining)}`
            )
          }
          return
        }

        const discussionLabels = discussion.labels?.nodes?.map(dl => dl.name)
        const exemptLabels = this.props.exemptLabels?.filter(label =>
          discussionLabels?.includes(label)
        )
        if (exemptLabels?.length) {
          if (this.props.verbose) {
            writeWithDiscussionNumber(
              discussion.number,
              `Skipping this discussion because it contains exempt label(s): [${exemptLabels.map(el => `'${el}'`).join(', ')}], see exempt-labels for more details`
            )
          }
          return
        }

        if (this.props.verbose) {
          writeWithDiscussionNumber(discussion.number, `└── Marked as stale`)
        }
        staleDiscussions.push(discussion)
      }

      if (this.props.verbose) {
        await withDiscussionLogGroup(
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
