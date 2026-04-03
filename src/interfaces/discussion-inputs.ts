import { DiscussionCloseReason } from './graphql-outputs'

export interface DiscussionInputProps {
  repoToken: string
  message: string
  threshold: Date
  categories?: string[]
  exemptLabels?: string[]
  closeUnanswered: boolean
  closeReason: DiscussionCloseReason
  debug: boolean
  rateLimitDelayMs: number
}
