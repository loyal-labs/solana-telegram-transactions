# Onboarding

Step-by-step onboarding for Telegram community admins and bot operators.

## Who This Is For

- Community admins who need to activate summaries in a Telegram group/supergroup
- Operators who manage bot setup, environment variables, and database whitelist access

## Flow Overview

1. Prepare bot/operator prerequisites
2. Add the bot to a Telegram community
3. Bot join webhook (`my_chat_member`) creates or resets community as inactive + non-public
4. Activate community tracking with `/activate_community`
5. Configure summary notifications with `/notifications`
6. Validate behavior for authorized and unauthorized users

## Guides

- [Add Bot and Activate Community](./add-bot-and-activate-community.md)
- [Set Up Notification Settings](./notifications.md)
