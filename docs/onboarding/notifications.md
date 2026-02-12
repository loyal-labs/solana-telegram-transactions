# Set Up Notification Settings

This guide explains how admins configure summary notification settings for an activated community.

## Prerequisites

1. The bot is added to the community.
2. The community is already activated with `/activate_community`.
3. The user changing settings is whitelisted in the `admins` table.

## Open Notification Settings

1. In the activated community chat, run `/notifications`.
2. The bot sends an inline settings panel for that community.

If the community is not activated, expected response is:

`This community is not activated. Use /activate_community to enable summaries.`

## Configure Settings

Use the inline buttons in the panel:

- Time trigger: `Off`, `24h`, `48h`
- Message trigger: `Off`, `500`, `1000`
- Master switch: `Off`, `On`

Each successful change updates the panel and shows:

`Notification settings updated`

## Authorization Behavior

### Whitelisted admin

- Can change settings directly from the inline panel
- Updated values are stored on the community record

### Non-whitelisted user

- Settings change is rejected
- Expected alert text:
`Only authorized users can do this. Text @spacesymmetry if you want to change something.`

## Operational Checklist

1. Confirm `/notifications` works in the target community.
2. Toggle each setting once to verify update path.
3. Ensure the final setting combination matches community preference.
4. Re-run `/notifications` if Telegram shows a stale panel.

## Notes

- Keep this as an admin-only operation controlled by the whitelist.
- Notification configuration is per-community and can be changed any time.

