# postiz-cli

Agent-ready CLI for the [Postiz public API](https://docs.postiz.com/public-api/introduction). Made with [api2cli.dev](https://api2cli.dev).

Schedule and manage social posts, connected channels (integrations), media uploads, analytics, notifications, and AI video helpers — with a JSON envelope (`{ ok, data, meta }`), retries, and an AgentSkill for Claude Code / Cursor / Codex.

**Category:** social

## Install

```bash
npx api2cli install Nardjo/postiz-cli
```

Clones the repo, builds the CLI, links it to your PATH, and installs the AgentSkill.

### AgentSkill only

```bash
npx skills add Nardjo/postiz-cli
```

## Quickstart

```bash
postiz-cli auth set "<API_KEY>"   # Settings → Developers → Public API
postiz-cli integrations connected --json
postiz-cli integrations list --json
postiz-cli --help
```

## Auth

Postiz expects the raw API key in the `Authorization` header (no `Bearer` prefix).  
`postiz-cli` uses `AUTH_TYPE=custom` for that.

Token file: `~/.config/tokens/postiz-cli.txt` (chmod 600).

## Rate limits

Postiz enforces a low hourly quota on the public API (historically ~30 req/h on some plans; create-post is specially limited). Prefer read smoke tests (`integrations connected` / `integrations list`) and batch posts in one request.

## Resources

| Resource | Actions |
|---|---|
| `integrations` | `list`, `connected`, `connect`, `settings`, `trigger`, `slot`, `delete` |
| `groups` | `list` |
| `posts` | `list`, `create`, `delete`, `delete-group`, `missing`, `release-id`, `status`, `settings` |
| `uploads` | `file`, `url` |
| `analytics` | `platform`, `post` |
| `notifications` | `list` |
| `video` | `generate`, `function` |
| `auth` | `set`, `show`, `remove`, `test` |

### integrations

| Action | Purpose |
|---|---|
| `list` | List channels. Flags: `--group`, `--json` |
| `connected` | `GET /is-connected` — validate API key |
| `connect <provider>` | OAuth URL. Flags: `--refresh <integrationId>` |
| `settings <id>` | Rules, schema, tools for a channel |
| `trigger <id> <method>` | Run a tool. Flags: `--data <json>`, `--param key=value` (repeatable) |
| `slot <id>` | Next available posting slot |
| `delete <id>` | Disconnect channel (and its scheduled posts) |

### groups

| Action | Purpose |
|---|---|
| `list` | List customers/groups |

### posts

| Action | Purpose |
|---|---|
| `list` | **Requires** `--start-date`, `--end-date` (ISO). Optional `--customer` |
| `create` | `--body` / `--file` **or** convenience `--type --date --integration --content --settings-type` |
| `delete <id>` | Delete post (whole group) |
| `delete-group <group>` | Delete by group id |
| `missing <id>` | Provider content when `releaseId` is `"missing"` |
| `release-id <id>` | `--release-id <value>` |
| `status <id>` | `--status draft\|schedule` |
| `settings <id>` | Merge settings via `--settings` / `--body` / `--file` |

### uploads

| Action | Purpose |
|---|---|
| `file <path>` | Multipart upload (`FormData` + `Bun.file`) |
| `url` | `--url <https://...>` upload-from-url |

### analytics

| Action | Purpose |
|---|---|
| `platform <id>` | `--days <n>` (sent as query `date`) |
| `post <id>` | `--days <n>` (sent as query `date`) |

### notifications / video

| Resource | Actions |
|---|---|
| `notifications list` | `--page` (default 0) |
| `video generate` | `--body` / `--file` |
| `video function` | `--function-name`, `--identifier`, optional `--params` JSON |

## Global flags

`--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: `0` success, `1` API error, `2` usage error.

## Notes

- UI “channel” == API `integration`.
- Upload media first (`uploads file` / `uploads url`), then reference `{ id, path }` in post `image` arrays — do not base64-inline large media.
- Binary name is `postiz-cli` (the official `postiz` CLI is separate).

## License

MIT
