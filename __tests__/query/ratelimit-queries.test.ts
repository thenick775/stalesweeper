import { buildFetchRateLimitQuery } from '../../src/query/ratelimit-queries'

describe('rate limit queries', () => {
  it('generate rate limit', () => {
    const query = buildFetchRateLimitQuery()
    expect(query).toEqual(`
query {
  rateLimit {
    limit
    remaining
  }
}`)
  })
})
