---
sidebar_position: 1900
---

# Notify bot PR events

tfaction has features that automatically create PRs, but you do not receive notifications when bot-created PRs are reviewed, merged, or closed.
This is not limited to tfaction -- it also applies to PRs authored by Renovate, Dependabot, Devin, and other bots.

A GitHub Action has been developed to solve this problem.
While not a tfaction feature, it is worth mentioning here.

https://github.com/suzuki-shunsuke/notify-bot-pr-event-action

By creating a workflow, you can receive notifications when bot-created PRs are reviewed, merged, or closed.

![approve](https://storage.googleapis.com/zenn-user-upload/3d0956b7fa03-20260219.png)

[If you use Slack, you can also configure GitHub to send Slack notifications.](https://docs.github.com/en/subscriptions-and-notifications/how-tos/managing-your-scheduled-reminders)

```yaml
name: Notify bot pr event
on:
  pull_request:
    types: [closed]
  pull_request_review:
    types: [submitted]
jobs:
  notify-bot-pr-event:
    # Filter events
    # pr author: Bot
    if: |
      endsWith(github.event.pull_request.user.login, '[bot]') &&
      (
        (
          github.event_name == 'pull_request_review' && github.event.review.state == 'approved'
        ) ||
        github.event_name == 'pull_request'
      )
    runs-on: ubuntu-slim
    timeout-minutes: 15
    permissions:
      pull-requests: write # To post pr comments
      contents: read # To read commits
    steps:
      - uses: suzuki-shunsuke/notify-bot-pr-event-action@latest
```
