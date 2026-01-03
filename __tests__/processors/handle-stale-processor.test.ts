import { HandleStaleDiscussions } from '../../src/processors/handle-stale-processor'
import { DiscussionNode } from '../../src/interfaces/graphql-outputs'
import * as core from '@actions/core'

let infoMock: jest.SpiedFunction<typeof core.info>

describe('HandleStaleDiscussions', () => {
  let processor: HandleStaleDiscussions

  beforeEach(() => {
    jest.clearAllMocks()

    processor = new HandleStaleDiscussions({
      repoToken: 'my-token',
      message: 'my-message',
      threshold: new Date(),
      category: undefined,
      closeUnanswered: false,
      closeReason: 'OUTDATED',
      verbose: false,
      debug: false
    })
  })

  it('should handle discussions correctly', async () => {
    const discussions: DiscussionNode[] = [
      {
        id: '1',
        number: 1,
        updatedAt: '2022-01-01T00:00:00Z',
        isAnswered: true,
        category: { name: 'Test Category', isAnswerable: true }
      }
    ]

    processor.executeQuery = jest
      .fn()
      .mockResolvedValue({ data: null, error: null })

    const result = await processor.process({
      discussions,
      owner: 'owner',
      repo: 'repo'
    })
    expect(result.success).toBe(true)
    expect(result.debug).toBe(false)
    expect(result.result).toEqual(discussions)
  })

  it('should handle comment error', async () => {
    const discussions: DiscussionNode[] = [
      {
        id: '1',
        number: 1,
        updatedAt: '2022-01-01T00:00:00Z',
        isAnswered: true,
        category: { name: 'Test Category', isAnswerable: true }
      }
    ]

    processor.executeQuery = jest.fn().mockResolvedValue({
      data: null,
      error: { name: 'ErrorType', message: 'ErrorMessage' }
    })

    const result = await processor.process({
      discussions,
      owner: 'owner',
      repo: 'repo'
    })
    expect(result.success).toBe(false)
    expect(result.debug).toBe(false)
    expect(result.error).toEqual({ name: 'ErrorType', message: 'ErrorMessage' })
  })

  it('should handle close error', async () => {
    const discussions: DiscussionNode[] = [
      {
        id: '1',
        number: 1,
        updatedAt: '2022-01-01T00:00:00Z',
        isAnswered: true,
        category: { name: 'Test Category', isAnswerable: true }
      }
    ]

    processor.executeQuery = jest
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { name: 'ErrorType', message: 'ErrorMessage' }
      })

    const result = await processor.process({
      discussions,
      owner: 'owner',
      repo: 'repo'
    })
    expect(result.success).toBe(false)
    expect(result.debug).toBe(false)
    expect(result.error).toEqual({ name: 'ErrorType', message: 'ErrorMessage' })
  })
  it('should handle debug and verbose mode correctly', async () => {
    processor.props.debug = true
    processor.props.verbose = true

    const discussions: DiscussionNode[] = [
      {
        id: '1',
        number: 1,
        updatedAt: '2022-01-01T00:00:00Z',
        isAnswered: true,
        category: { name: 'Test Category', isAnswerable: true }
      }
    ]

    infoMock = jest.spyOn(core, 'info').mockImplementation(() => {})

    const result = await processor.process({
      discussions,
      owner: 'owner',
      repo: 'repo'
    })
    expect(infoMock).toHaveBeenCalledTimes(2)
    expect(result.success).toBe(true)
    expect(result.debug).toBe(true)
    expect(infoMock).toHaveBeenCalledWith(
      '  [#1] Adding comment and closing discussion #1'
    )
    expect(infoMock).toHaveBeenCalledWith(
      '  [#1] └── [dry-run] Would comment and close this discussion'
    )
  })
})
