import { Router, Request, Response } from "express";
import { decodeConfig, encodeConfig, parseStreamId } from "./config.js";
import { buildManifest } from "./manifest.js";
import { buildConfigurePage } from "./configure.js";
import { buildProviderTasks, fetchAllStreams } from "./providers/index.js";
import { applyFormatter, isValidStreamUrl } from "./formatter.js";
import { DEFAULT_CONFIG, PROVIDER_LIST, qualityRank, matchesResolutionFilter } from "./types.js";
import { refreshShowBoxToken } from "./providers/showbox.js";

export function createAddonRouter(addonBasePath: string): Router {
  const router = Router();

  function getBaseUrl(req: Request): string {
    const protocol = req.headers["x-forwarded-proto"] ?? req.protocol;
    const host = req.headers["x-forwarded-host"] ?? req.get("host");
    return `${protocol}://${host}${addonBasePath}`;
  }

  router.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    next();
  });

  router.options("/{*path}", (_req, res) => res.sendStatus(200));

  router.get("/manifest.json", (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    const manifest = buildManifest(DEFAULT_CONFIG, baseUrl);
    res.json(manifest);
  });

  router.get("/configure", (req: Request, res: Response) => {
    const baseUrl = getBaseUrl(req);
    const html = buildConfigurePage(DEFAULT_CONFIG, baseUrl);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });

  router.get("/:config/manifest.json", (req: Request, res: Response) => {
    const config = decodeConfig(String(req.params.config));
    const baseUrl = getBaseUrl(req);
    const manifest = buildManifest(config, baseUrl);
    res.json(manifest);
  });

  router.get("/:config/configure", (req: Request, res: Response) => {
    const config = decodeConfig(String(req.params.config));
    const baseUrl = getBaseUrl(req);
    const html = buildConfigurePage(config, baseUrl);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });

  router.get("/test-providers.json", async (_req: Request, res: Response) => {
    const timeout = 5000;
    const results = await Promise.allSettled(
      PROVIDER_LIST.map(async (p) => {
        const start = Date.now();
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeout);
          const resp = await fetch(p.healthUrl, {
            method: "HEAD",
            signal: controller.signal,
          }).finally(() => clearTimeout(timer));
          return {
            id: p.id,
            name: p.name,
            ok: resp.status < 500,
            statusCode: resp.status,
            latencyMs: Date.now() - start,
          };
        } catch {
          return {
            id: p.id,
            name: p.name,
            ok: false,
            statusCode: 0,
            latencyMs: Date.now() - start,
          };
        }
      })
    );
    const statuses = results.map((r) =>
      r.status === "fulfilled" ? r.value : { id: "unknown", name: "unknown", ok: false, statusCode: 0, latencyMs: 0 }
    );
    res.json({ providers: statuses });
  });

  /** POST /showbox-refresh — attempt to auto-login and return a fresh JWT */
  router.post("/showbox-refresh", async (req: Request, res: Response) => {
    const body = req.body as { email?: string; password?: string };
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "").trim();

    if (!email || !password) {
      res.status(400).json({ success: false, error: "email and password are required" });
      return;
    }

    const result = await refreshShowBoxToken(email, password, 12000);
    res.json(result);
  });

  router.get("/:config/stream/:type/:id.json", async (req: Request, res: Response) => {
    const config = decodeConfig(String(req.params.config));
    const type = String(req.params.type);
    const id = String(req.params.id);

    const { tmdbId, season, episode } = parseStreamId(type, id);

    const tasks = buildProviderTasks(config, tmdbId, type, season, episode);
    const rawStreams = await fetchAllStreams(tasks);

    const validStreams = rawStreams.filter((s) => isValidStreamUrl(s.url));

    const filteredStreams = validStreams.filter((s) =>
      matchesResolutionFilter(s.quality, config.resolutionFilter)
    );

    const sortedStreams = [...filteredStreams].sort(
      (a, b) => qualityRank(b.quality) - qualityRank(a.quality)
    );

    const formattedStreams = sortedStreams.map((s) =>
      applyFormatter(s, config.formatter.nameTemplate, config.formatter.descTemplate)
    );

    res.json({ streams: formattedStreams });
  });

  router.get("/stream/:type/:id.json", async (req: Request, res: Response) => {
    const type = String(req.params.type);
    const id = String(req.params.id);
    const { tmdbId, season, episode } = parseStreamId(type, id);

    const tasks = buildProviderTasks(DEFAULT_CONFIG, tmdbId, type, season, episode);
    const rawStreams = await fetchAllStreams(tasks);
    const validStreams = rawStreams.filter((s) => isValidStreamUrl(s.url));

    const sortedStreams = [...validStreams].sort(
      (a, b) => qualityRank(b.quality) - qualityRank(a.quality)
    );

    const formattedStreams = sortedStreams.map((s) =>
      applyFormatter(
        s,
        DEFAULT_CONFIG.formatter.nameTemplate,
        DEFAULT_CONFIG.formatter.descTemplate
      )
    );

    res.json({ streams: formattedStreams });
  });

  return router;
}
