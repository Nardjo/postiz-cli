---
name: postiz-cli
description: "Manage Postiz social scheduling via CLI — integrations, posts, uploads, analytics, notifications, video. Use when the user mentions Postiz, social scheduling, or connected channels."
category: social
---

# postiz-cli

Agent-ready CLI for the Postiz public API (`https://api.postiz.com/public/v1`).

## When To Use This Skill

- List or connect social channels (integrations)
- Schedule / create / delete posts
- Upload media for posts
- Read platform or post analytics
- Check notifications or run AI video helpers
- Authenticate and smoke-test a Postiz API key

## Setup

```bash
bun --version || curl -fsSL https://bun.sh/install | bash
npx api2cli install Nardjo/postiz-cli
# or from a local checkout:
npx api2cli bundle postiz
npx api2cli link postiz
```

Always pass `--json` for agent-driven calls.

## Authentication

```bash
postiz-cli auth set "<API_KEY>"   # Settings → Developers → Public API
postiz-cli auth test
postiz-cli integrations connected --json
```

Raw API key in `Authorization` (no Bearer). Stored at `~/.config/tokens/postiz-cli.txt`.

## Rate limits

Low hourly quota (~30 req/h on some plans; create-post specially limited). Prefer `integrations connected` / `integrations list` for smoke tests. Batch multiple posts in one `posts create` body.

## Working Rules

- Always `--json` for parseable `{ ok, data, meta }` envelopes.
- Prefer read commands before mutating.
- Upload media first; reference returned `{ id, path }` in post payloads.
- UI “channel” == API `integration`.
- Use `postiz-cli <resource> <action> --help` instead of guessing flags.

## Resources

### `integrations`
| Action | Purpose |
|---|---|
| `list` | List channels. `--group`, `--json` |
| `connected` | Validate API key (`GET /is-connected`) |
| `connect <provider>` | OAuth URL. `--refresh <id>` |
| `settings <id>` | Schema + tools |
| `trigger <id> <method>` | `--data <json>`, `--param key=value` (repeatable) |
| `slot <id>` | Next available slot |
| `delete <id>` | Disconnect channel |

### `groups`
| Action | Purpose |
|---|---|
| `list` | List customers/groups |

### `posts`
| Action | Purpose |
|---|---|
| `list` | **Requires** `--start-date` `--end-date`. Optional `--customer` |
| `create` | `--body`/`--file` **or** `--type --date --integration --content --settings-type` |
| `delete <id>` | Delete post group |
| `delete-group <group>` | Delete by group id |
| `missing <id>` | Resolve missing releaseId |
| `release-id <id>` | `--release-id <value>` |
| `status <id>` | `--status draft\|schedule` |
| `settings <id>` | Merge settings `--settings`/`--body`/`--file` |

### `uploads`
| Action | Purpose |
|---|---|
| `file <path>` | Multipart upload |
| `url` | `--url` upload-from-url |

### `analytics`
| Action | Purpose |
|---|---|
| `platform <id>` | `--days <n>` → query `date` |
| `post <id>` | `--days <n>` → query `date` |

### `notifications`
| Action | Purpose |
|---|---|
| `list` | `--page` (default 0) |

### `video`
| Action | Purpose |
|---|---|
| `generate` | `--body` / `--file` |
| `function` | `--function-name`, `--identifier`, `--params` |

### `auth`
`set`, `show`, `remove`, `test`

## Output Format

```json
{ "ok": true, "data": { }, "meta": { "total": 42 } }
```

Error: `{ "ok": false, "error": { "message": "...", "code": 401 } }`

## Quick Reference

```bash
postiz-cli --help
postiz-cli integrations list --json
postiz-cli posts list --start-date 2024-01-01T00:00:00.000Z --end-date 2024-12-31T23:59:59.000Z --json
postiz-cli uploads file ./image.png --json
```

## Global Flags

`--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: 0 success, 1 API error, 2 usage error
