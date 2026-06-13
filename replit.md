# Herum Na — Nuvio Addon

A multi-source Nuvio/Stremio streaming addon that aggregates direct HTTP/HTTPS streams from 6 providers with a configuration page, stream name/description formatter, and full deployment support for Vercel, Render, and Railway.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-server run build` — build the api-server only
- Required env: none (all provider keys are embedded defaults)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/addon/` — all addon code
  - `types.ts` — AddonConfig type + DEFAULT_CONFIG + Stream type
  - `config.ts` — encodeConfig / decodeConfig / parseStreamId
  - `manifest.ts` — buildManifest (Nuvio/Stremio manifest response)
  - `configure.ts` — buildConfigurePage (self-contained HTML config UI)
  - `formatter.ts` — applyFormatter + isValidStreamUrl
  - `router.ts` — Express router, all addon HTTP endpoints
  - `providers/` — one file per provider + index.ts (fan-out)

## Addon endpoints

| Path | Description |
|---|---|
| `/addon/manifest.json` | Default manifest (all providers) |
| `/addon/configure` | Config page (default settings) |
| `/addon/{config}/manifest.json` | Per-user manifest |
| `/addon/{config}/configure` | Config page pre-filled from config |
| `/addon/stream/{type}/{id}.json` | Streams (default config) |
| `/addon/{config}/stream/{type}/{id}.json` | Streams (per-user config) |

## Providers

| Provider | Status | Notes |
|---|---|---|
| **4KHDHub** | ✅ Working | Via Mushi backend: search→extract two-step |
| **ShowBox** | Conditional | Needs fresh ShowBox JWT cookie; returns streams when service is up |
| **DahmerMovies** | Configured | Graceful fallback if API down |
| **PlayIMDb** | Configured | Graceful fallback if API down |
| **VidSrc** | Configured | Graceful fallback (embed scraping) |
| **Peachify** | Configured | Graceful fallback if API down |

## Mushi Backend (4KHDHub)

Two-step flow for 4KHDHub:
1. `POST /search` with `{site, query, year, type}` → get page URL
2. `POST /extract` with `{site, url, type, tmdb_id, season, episode}` → get streams

**Key**: IMDb IDs (`tt...`) must first be resolved to TMDB numeric IDs via `/3/find/{imdb_id}?external_source=imdb_id` before passing to Mushi.

## Deployment

| Platform | Config File | Build | Start |
|---|---|---|---|
| **Render** | `render.yaml` | pnpm build | node dist/index.mjs |
| **Railway** | `railway.toml` | pnpm build | node dist/index.mjs |
| **Vercel** | `vercel.json` | pnpm build | dist/index.mjs |
| **Generic** | `Procfile` | — | node dist/index.mjs |

## Architecture decisions

- **Config in URL**: User config is base64url-encoded JSON in the Stremio manifest URL path — zero server-side state, fully portable
- **IMDb→TMDB resolution**: Nuvio sends `tt` IMDb IDs; all TMDB-dependent providers call `/find/{id}?external_source=imdb_id` to get the numeric TMDB ID before any upstream API call
- **Graceful fanout**: All providers run in parallel via `Promise.allSettled` — one failed provider never blocks others
- **Mushi search→extract**: 4KHDHub requires a title-based search to get the content page URL, then a separate extract call — direct TMDB ID lookup is not supported
- **Formatter at the edge**: Stream name/description formatting happens in the router after all providers resolve, keeping providers pure

## Product

Users install the addon into Nuvio by visiting `/addon/configure`, toggle which of the 6 providers they want, optionally paste a ShowBox JWT cookie for ShowBox streams, customize the stream name/description templates, then click "Copy Manifest Link" to get their personalized install URL.

## User preferences

_Populate as you build._

## Gotchas

- Mushi backend (`piratezoro9-mushi-master.hf.space`) only supports `4khdhub` and `4khdhubnew` — all other site names return an error
- ShowBox JWT cookie expires — users must refresh it periodically from ShowBox's website
- DahmerMovies at `a.111477.xyz` is a file server (directory listing), not a JSON API
- Express 5 path-to-regexp v8 requires `/{*path}` not `*` for wildcard routes

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
