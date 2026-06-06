# zealdocs.org backend

Bun/Elysia application serving `api.zealdocs.org` and `go.zealdocs.org`.

Docsets are updated daily using GitHub Actions.

> [!WARNING]
> These endpoints exist to serve the Zeal application. There is no SLA, no
> stability guarantee, and no deprecation policy. Paths, response shapes, and
> behavior may change or disappear at any time without notice. If you build
> something on top of this API, you accept that it can break under you.

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

## Analytics

Request events are sent to a Tinybird workspace when `TINYBIRD_TOKEN` is set in
the Vercel environment. Without the token, `track()` is a no-op (so local dev and
tests never hit the network). Schema, queries, and deploy instructions live in
[`tinybird/`](./tinybird/README.md).
