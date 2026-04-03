import { Processor } from '../interfaces/processable'
import { DiscussionInputProps } from '../interfaces/discussion-inputs'
import { SimulationResult } from '../interfaces/simulation-result'
import { getInput } from '@actions/core'
import { DiscussionPropsValidationError } from '../errors/discussion-props-validation-error'
import { DiscussionCloseReason } from '../interfaces/graphql-outputs'

interface RawDiscussionInputProps {
  repoToken: string
  message: string
  daysBeforeClose: number
  categories: string | undefined
  exemptLabels: string
  closeReason: string
}

export class DiscussionInputProcessor implements Processor<
  undefined,
  DiscussionInputProps | undefined
> {
  // eslint-disable-next-line @typescript-eslint/require-await -- see Processor type
  async process(): Promise<SimulationResult<DiscussionInputProps | undefined>> {
    const repoToken = getInput('repo-token')
    const message = getInput('message')
    const daysBeforeClose = parseInt(getInput('days-before-close'))
    const categories = getInput('categories')
    const exemptLabelsRaw = getInput('exempt-labels')
    const closeUnanswered = getInput('close-unanswered') === 'true'
    const closeReason = getInput('close-reason')
    const debug = getInput('dry-run') === 'true'
    const rateLimitDelayMs = parseInt(getInput('rate-limit-delay'))

    const raw: RawDiscussionInputProps = {
      repoToken,
      message,
      daysBeforeClose,
      categories,
      exemptLabels: exemptLabelsRaw,
      closeReason: closeReason.toUpperCase()
    }

    const exemptLabels = exemptLabelsRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const categoriesList = categories
      .split(',')
      .map(c => c.trim())
      .filter(Boolean)

    const threshold = new Date()
    threshold.setDate(threshold.getDate() - daysBeforeClose)

    try {
      this._validateProps(raw)
    } catch (error) {
      return {
        result: undefined,
        error: error as Error,
        success: false,
        debug
      }
    }

    return {
      result: {
        repoToken,
        message,
        threshold,
        categories: categoriesList.length > 0 ? categoriesList : undefined,
        exemptLabels,
        closeUnanswered,
        closeReason: raw.closeReason as DiscussionCloseReason,
        debug,
        rateLimitDelayMs
      },
      success: true,
      debug
    }
  }

  _validateProps(
    props: RawDiscussionInputProps
  ): DiscussionPropsValidationError | undefined {
    if (isNaN(props.daysBeforeClose)) {
      throw new DiscussionPropsValidationError(
        `Option "${props.daysBeforeClose}" did not parse to a valid number`
      )
    }

    switch (props.closeReason) {
      case 'DUPLICATE':
      case 'OUTDATED':
      case 'RESOLVED':
        return
      default:
        throw new DiscussionPropsValidationError(
          `Invalid DiscussionCloseReason: ${props.closeReason}`
        )
    }
  }
}
