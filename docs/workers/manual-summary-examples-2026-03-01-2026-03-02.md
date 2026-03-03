# Manual Summary Examples (2026-03-01 to 2026-03-02 UTC)

This document captures manually curated daily summaries used as reference examples for high-quality Telegram community summarization.

## Scope

- Target window (UTC): `2026-03-01` and `2026-03-02`
- Policy: only meaningful community/day pairs (skip zero-activity and spam-heavy feed cases)
- Delivery: database records + this markdown reference
- Notification sending: not performed

## Quality Rules Applied

- Oneliner is concise, specific, and non-hype (`<= 110` chars)
- Topics are limited to 1-5 and focus on meaningful discussion
- Greeting noise, command spam, and repetitive low-value chatter are excluded from topic shaping
- Topic `sources` contain participants who materially contributed
- First sentence of each topic is written to stand alone (for bullet rendering)

## Best-Practice References Used

- Reuters Trust Principles: <https://www.reuters.com/agency/trust-principles/>
- GOV.UK writing guidance: <https://www.gov.uk/guidance/content-design/writing-for-gov-uk>
- GOV.UK docs style guide: <https://docs.publishing.service.gov.uk/manual/docs-style-guide.html>
- QAGS factual consistency framing: <https://aclanthology.org/2020.acl-main.450/>
- US Plain Writing principles: <https://www.archives.gov/open/plain-writing/10-principles.html>

## Inserted Summaries

### 1) The Loyal Community — 2026-03-01

- `summary_id`: `2c73e2b2-2ebb-4325-92d0-95f9d7de80a5`
- `trigger_key`: `daily:2026-03-01`
- `community_id`: `e2c7fb8d-119f-4fff-b3bf-8509d55dd25c`
- `chat_id`: `-1002981429221`
- `message_count`: `19`
- `from_message_id`: `29244`
- `to_message_id`: `29270`

**Oneliner**

`New-month check-ins turned into product talk on summary timing and where persistent storage fits next.`

**Topics JSON**

```json
[
  {
    "title": "Community kickoff and safety check-ins",
    "content": "Members opened the month with greetings and safety wishes as regional conflict concerns filtered into chat sentiment.",
    "sources": ["gemhunter", "nel ogx", "ROYALREDDY", "Gaurav", "Hexx"]
  },
  {
    "title": "Daily summary timing clarified",
    "content": "A short support thread clarified why no new summary had appeared yet: the daily report is generated after the day is complete.",
    "sources": ["裴嘉輝 裴嘉輝", "gemhunter"]
  },
  {
    "title": "Persistent storage vs execution priorities",
    "content": "Late in the day, members debated persistent storage timing versus TEE-first execution, with a direct comparison to Venice and Loyal's product focus.",
    "sources": ["8️⃣6️⃣.eth | 0548.eth", "chris"]
  }
]
```

**Source excerpts used**

- `29248` (`2026-03-01T04:05:47Z`, `gemhunter`): "Happy New Month, and if you're in hot zones with the ongoing war, please stay safe."
- `29265` (`2026-03-01T17:41:10Z`, `裴嘉輝 裴嘉輝`): "Why is there no update?"
- `29267` (`2026-03-01T17:42:01Z`, `gemhunter`): "Why would it make update for a day not spent yet?"
- `29269` (`2026-03-01T23:52:24Z`, `8️⃣6️⃣.eth | 0548.eth`): persistent storage timing concern vs roadmap
- `29270` (`2026-03-01T23:55:55Z`, `chris`): product-focus response and Venice comparison

---

### 2) The Loyal Community — 2026-03-02

- `summary_id`: `498557bb-e5af-46d4-9402-45b4158de49b`
- `trigger_key`: `daily:2026-03-02`
- `community_id`: `e2c7fb8d-119f-4fff-b3bf-8509d55dd25c`
- `chat_id`: `-1002981429221`
- `message_count`: `46`
- `from_message_id`: `29271`
- `to_message_id`: `29327`

**Oneliner**

`Roadmap day at Loyal: storage priorities, private-rollup mechanics, and wallet UX questions before launch.`

**Topics JSON**

```json
[
  {
    "title": "Persistent storage roadmap revisited",
    "content": "A long thread revisited persistent chat memory, with the team confirming it remains planned but deferred until current launch milestones are shipped.",
    "sources": ["8️⃣6️⃣.eth | 0548.eth", "chris"]
  },
  {
    "title": "PER privacy model and documentation gaps",
    "content": "Chris explained that actions run in MagicBlock PER and settle state back to Solana without publishing intermediate activity on mainnet, while members asked for clearer docs on the model.",
    "sources": ["chris", "8️⃣6️⃣.eth | 0548.eth"]
  },
  {
    "title": "Launch readiness and wallet UX Q&A",
    "content": "Members asked practical questions on shielding behavior, wallet replacement safety, and multi-wallet support, receiving clear guidance on current limits and next steps.",
    "sources": ["Will", "Hexx", "chris"]
  },
  {
    "title": "Community operations and partnership routing",
    "content": "The rest of the day focused on onboarding chatter and operations, including routing partnership outreach to main@askloyal.com.",
    "sources": ["nel ogx", "michael", "INVESTORADESAM", "gemhunter"]
  }
]
```

**Source excerpts used**

- `29272` (`2026-03-02T00:02:35Z`, `chris`): "how would group summaries work w/o persistent storage?.."
- `29276` (`2026-03-02T00:13:53Z`, `chris`): storage work deferred until current priorities complete
- `29280` (`2026-03-02T00:16:29Z`, `8️⃣6️⃣.eth | 0548.eth`): anonymity-set and rollup lifetime questions
- `29289` (`2026-03-02T00:29:15Z`, `chris`): settlement model explanation (state updated, actions not on main ledger)
- `29301` (`2026-03-02T07:58:26Z`, `Will`): shielded funds and multi-wallet UX questions
- `29311` (`2026-03-02T10:35:31Z`, `Hexx`): shielding and one-wallet current-state clarification
- `29325` (`2026-03-02T16:37:55Z`, `INVESTORADESAM`) + `29326` (`gemhunter`): partnership routing to `main@askloyal.com`

---

### 3) turbine.cash — 2026-03-02

- `summary_id`: `1b5a2d13-3253-4f8b-9b5e-b2cd8af6813f`
- `trigger_key`: `daily:2026-03-02`
- `community_id`: `04ccb37c-aead-42b9-864c-6012537cc8e1`
- `chat_id`: `-1002735351372`
- `message_count`: `7`
- `from_message_id`: `9824`
- `to_message_id`: `9847`

**Oneliner**

`Quiet day in turbine.cash: partnership routing and a practical integration Q&A carried the chat.`

**Topics JSON**

```json
[
  {
    "title": "Partnership inquiry triage",
    "content": "A partnership request was acknowledged quickly, with moderators moving the discussion to direct messages for follow-up.",
    "sources": ["INVESTORADESAM", "Mango"]
  },
  {
    "title": "Integration interest from community",
    "content": "A member asked whether Turbine is integrating other projects, and moderators invited a direct conversation to scope requirements.",
    "sources": ["alby", "Mango"]
  },
  {
    "title": "Low-volume social check-ins",
    "content": "Morning greetings and brief check-ins set a light, low-traffic tone for the day.",
    "sources": ["Asad Sohail || BD at CoinUp", "Mango"]
  }
]
```

**Source excerpts used**

- `9841` (`2026-03-02T16:15:28Z`, `INVESTORADESAM`): partnership contact request
- `9842` (`2026-03-02T16:17:28Z`, `Mango`): "Replied to you in dms ;)"
- `9846` (`2026-03-02T19:48:10Z`, `alby`): integration question
- `9847` (`2026-03-02T20:10:53Z`, `Mango`): invitation to continue in DM
- `9824` / `9827`: brief morning check-ins

## Excluded Community-Day Pairs (with reason)

- `Loyal News` — `2026-03-01`: high-volume single-sender headline feed; excluded for example quality
- `Loyal News` — `2026-03-02`: high-volume single-sender headline feed; excluded for example quality
- `Offerwall group testing` — `2026-03-01`: `0` messages
- `Offerwall group testing` — `2026-03-02`: `0` messages
- `Unitaware: AI & inference` — `2026-03-01`: `0` messages
- `Unitaware: AI & inference` — `2026-03-02`: `0` messages
- `turbine.cash` — `2026-03-01`: `0` messages

## Verification Snapshot

- Inserted `daily:*` summaries in target window: `3`
- Inserted pairs:
  - `The Loyal Community` → `daily:2026-03-01`
  - `The Loyal Community` → `daily:2026-03-02`
  - `turbine.cash` → `daily:2026-03-02`
- Topic counts: `3`, `4`, `3` (all within 1-5)
- Oneliner lengths are within the `<= 110` limit
