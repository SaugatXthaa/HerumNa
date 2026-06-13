---
name: Vercel + pnpm monorepo + Express deployment
description: How to correctly deploy a pre-built Express server from a pnpm monorepo to Vercel as a serverless function
---

## The rule
Copy the pre-built ESM bundle into `api/index.mjs` **during** the `buildCommand`. Vercel auto-detects all files in `api/` after build completes as serverless functions — including `.mjs` files.

**Why:** The `functions` key in `vercel.json` configures functions by path relative to the project root, NOT relative to `outputDirectory`. The `outputDirectory` mode only exposes static assets, not serverless functions. Vercel's entrypoint search only recognizes filenames `app/index/server` — custom names like `vercel.mjs` are never found unless explicitly placed in `api/`.

**How to apply:**
```json
{
  "version": 2,
  "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build && mkdir -p api && cp artifacts/api-server/dist/vercel.mjs api/index.mjs",
  "routes": [{ "src": "/(.*)", "dest": "/api/index" }]
}
```
The Vercel entry point (`src/vercel.ts`) must export `default app` — NOT call `app.listen()`. The `dist/vercel.mjs` bundle is built by a separate esbuild entry alongside `dist/index.mjs` (which does listen, used by Render/Railway).
