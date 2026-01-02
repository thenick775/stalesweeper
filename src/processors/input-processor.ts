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
  category: string | undefined
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
    const category = getInput('category')
    const closeUnanswered = getInput('close-unanswered') === 'true'
    const closeReason = getInput('close-reason')
    const verbose = getInput('verbose') === 'true'
    const debug = getInput('dry-run') === 'true'

    const raw: RawDiscussionInputProps = {
      repoToken,
      message,
      daysBeforeClose,
      category,
      closeReason: closeReason.toUpperCase()
    }

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
        category: category === '' ? undefined : category,
        closeUnanswered,
        closeReason: raw.closeReason as DiscussionCloseReason,
        verbose,
        debug
      } as DiscussionInputProps,
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
