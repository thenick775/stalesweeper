jest.mock('@actions/core', () => {
  const actual =
    jest.requireActual<typeof import('@actions/core')>('@actions/core')
  return {
    ...actual,
    info: jest.fn(),
    startGroup: jest.fn(),
    endGroup: jest.fn(),
    debug: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    getInput: jest.fn()
  }
})
