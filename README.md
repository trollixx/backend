# zealdocs.org backend

Bun/Elysia application serving `api.zealdocs.org` and `go.zealdocs.org`.

Docsets are updated daily using GitHub Actions.

## Routes

| Host | Path | Description |
|------|------|-------------|
| `*.zealdocs.org` | `GET /` | Redirect to `https://zealdocs.org` |
| `api.zealdocs.org` | `GET /v1/releases` | Zeal release list |
| `api.zealdocs.org` | `GET /v1/docsets` | Docset catalog |
| `go.zealdocs.org` | `GET /l/:linkId` | Link redirects |
| `go.zealdocs.org` | `GET /d/:sourceId/:docsetId/:version` | Redirect to nearest Kapeli mirror (`latest` or specific version) |

## Development

```bash
bun install
bun run dev   # hot-reload dev server on :3000
bun test      # run tests
```

## Build

Generates `public/_api/v1/docsets.json`, `catalog.json`, and `releases.json`:

```bash
git clone https://github.com/Kapeli/feeds.git build/feeds
git clone https://github.com/Kapeli/Dash-X-Platform-Resources.git build/resources
bun run build
```

## Deploy

Deployment to Vercel is handled automatically by the GitHub Actions workflow on every push to `main` and on a daily schedule.
