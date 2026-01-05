[![Stale Discussions](./logo/banner.png)](https://github.com/thenick775/stalesweeper/)

[![Lint Codebase](https://github.com/thenick775/stalesweeper/actions/workflows/linter.yml/badge.svg)](https://github.com/thenick775/stalesweeper/actions/workflows/linter.yml)
[![Continuous Integration](https://github.com/thenick775/stalesweeper/actions/workflows/ci.yml/badge.svg)](https://github.com/thenick775/stalesweeper/actions/workflows/ci.yml)
[![Check Transpiled JavaScript](https://github.com/thenick775/stalesweeper/actions/workflows/check-dist.yml/badge.svg)](https://github.com/thenick775/stalesweeper/actions/workflows/check-dist.yml)

## Purpose

$${\textsf{\color{#1ab458}Initiators should be responsible for closing discussions.}}$$

$${\textsf{\color{#1ab458}Discussions left open can lead to cluttered forums.}}$$

$${\textsf{\color{#1ab458}StaleSweeper provides a solution for de-cluttering your GitHub discussions.}}$$

## All options

| **Argument**      | **Description**                                                                                                                  | **Required** | **Options**                         | **Default**           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | :----------: | ----------------------------------- | --------------------- |
| repo-token        | Token for the repository. Can be passed in using `{{ secrets.GITHUB_TOKEN }}`.                                                   |      No      |                                     | `${{ github.token }}` |
| message           | The message to post on the discussion when closing it. This can be customized as per your requirements.                          |      No      |                                     |                       |
| days-before-close | The number of days to wait before closing a stale discussion. This is a required field.                                          |     Yes      |                                     |                       |
| close-unanswered  | If set to `true`, stale discussions that have not been marked as answered will also be closed.                                   |      No      | `true`, `false`                     | `false`               |
| category          | The category of discussions to close. If not specified, all categories will be considered.                                       |      No      |                                     | All, no filtering     |
| exempt-labels     | The labels that mean a discussion is exempt from being marked stale. Separate multiple labels with commas (eg. "label1,label2"). |      No      |                                     | All, no filtering     |
| close-reason      | The reason to use when closing a discussion.                                                                                     |      No      | `DUPLICATE`, `OUTDATED`, `RESOLVED` | `OUTDATED`            |
| dry-run           | If set to `true`, the processor will run in debug mode without performing any operations on live discussions.                    |      No      | `true`, `false`                     | `false`               |

## Permissions

For the execution of this action, it must be able to fetch all discussions from
your repository. To do this, you'll need to provide a `repo-token` with the
necessary permissions. If you're using the default `GITHUB_TOKEN`, you'll need
to add the following permission to your workflow at a minimum:

```yaml
permissions:
  discussions: read
```

Depending on the configuration, the action may require additional permissions
(e.g., to add comments). In this case, you might need to extend the permissions
in your workflow:

```yaml
permissions:
  discussions: write
```

## Example

Here's an example of a workflow that runs the action every day at midnight UTC.
It closes all discussions that have been inactive for 14 days and posts a
message on the discussion when closing it.

```yaml
name: Close Stale Discussions

on:
  schedule:
    - cron: '0 0 * * *' # Runs every day at midnight UTC

jobs:
  close-stale-discussions:
    runs-on: ubuntu-latest

    steps:
      - name: Run action
        uses: thenick775/stalesweeper@main
        with:
          message: 'This discussion has been closed due to inactivity.'
          days-before-close: '14'
```

## Credits

Big thanks to [steffen-karlsson](https://github.com/steffen-karlsson) for the
[original implementation](https://github.com/steffen-karlsson/stalesweeper)
