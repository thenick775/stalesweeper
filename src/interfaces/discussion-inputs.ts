import { DiscussionCloseReason } from './graphql-outputs'

export interface DiscussionInputProps {
  repoToken: string
  message: string
  threshold: Date
  category: string | undefined
  exemptLabels?: string[]
  closeUnanswered: boolean
  closeReason: DiscussionCloseReason
  verbose: boolean
  debug: boolean
}
