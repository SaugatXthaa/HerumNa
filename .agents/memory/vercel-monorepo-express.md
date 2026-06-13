---
name: Vercel monorepo Express deployment
description: How to deploy the pnpm monorepo Express addon to Vercel without filesystem permission errors
---

## The rule

Use a committed `api/index.js` CJS bridge that dynamically imports the pre-built ESM bundle. Do NOT copy files in buildCommand — Vercel's build sandbox is read-only after the build phase.

**Why:** `cp artifacts/api-server/dist/vercel.mjs api/index.mjs` always exits with code 1 on Vercel even though the build itself succeeds, because the project directory is read-only after the build step.

**How to apply:**
1. Commit `api/index.js` at the repo root — a tiny CJS file that does `import(path.join(process.cwd(), "artifacts/api-server/dist/vercel.mjs"))`
2. `vercel.json` → `functions: { "api/index.js": { "includeFiles": "artifacts/api-server/dist/**" } }`
3. `buildCommand` only builds: `npm install -g pnpm@10 --ignore-scripts && pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api-server run build`
4. No mkdir, no cp.

## esbuild-plugin-pino conflict

Using `esbuildPluginPino` in TWO sequential esbuild calls fails on Vercel — the second call tries to write pino worker files that already exist and throws. Only the first bundle appears in the build log; the build exits with code 1.

**Fix:** Single esbuild call with BOTH entry points as an array:
```js
await esbuild({
  ...SHARED, // plugins: [esbuildPluginPino(...)] in here
  entryPoints: [
    path.resolve(artifactDir, "src/index.ts"),
    path.resolve(artifactDir, "src/vercel.ts"),
  ],
  outdir: distDir,
});
```
Pino plugin runs once, both `index.mjs` and `vercel.mjs` are emitted cleanly.

## Vercel "Redeploy" gotcha

Clicking "Redeploy" in Vercel redeploys from the SAME old commit — it does NOT pick up new commits. To deploy new code, wait for the auto-trigger from the GitHub push webhook, or use "Deploy" → select branch → latest commit from the Vercel dashboard.
