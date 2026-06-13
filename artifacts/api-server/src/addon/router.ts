import { Router, Request, Response } from "express";
import { decodeConfig, encodeConfig, parseStreamId } from "./config.js";
import { buildManifest } from "./manifest.js";
import { buildConfigurePage } from "./configure.js";
import { buildProviderTasks, fetchAllStreams } from "./providers/index.js";
import { applyFormatter, isValidStreamUrl } from "./formatter.js";
import { DEFAULT_CONFIG } from "./types.js";

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

  router.get("/:config/stream/:type/:id.json", async (req: Request, res: Response) => {
    const config = decodeConfig(String(req.params.config));
    const type = String(req.params.type);
    const id = String(req.params.id);

    const { tmdbId, season, episode } = parseStreamId(type, id);

    const tasks = buildProviderTasks(config, tmdbId, type, season, episode);
    const rawStreams = await fetchAllStreams(tasks);

    const validStreams = rawStreams.filter((s) => isValidStreamUrl(s.url));

    const formattedStreams = validStreams.map((s) =>
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
    const formattedStreams = validStreams.map((s) =>
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
