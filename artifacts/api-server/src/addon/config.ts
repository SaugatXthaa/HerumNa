import { AddonConfig, DEFAULT_CONFIG } from "./types.js";

export function encodeConfig(config: Partial<AddonConfig>): string {
  const merged: AddonConfig = {
    providers: config.providers ?? DEFAULT_CONFIG.providers,
    showboxCookie: config.showboxCookie ?? DEFAULT_CONFIG.showboxCookie,
    formatter: {
      nameTemplate: config.formatter?.nameTemplate ?? DEFAULT_CONFIG.formatter.nameTemplate,
      descTemplate: config.formatter?.descTemplate ?? DEFAULT_CONFIG.formatter.descTemplate,
    },
    timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
    resolutionFilter: config.resolutionFilter ?? DEFAULT_CONFIG.resolutionFilter,
  };
  return Buffer.from(JSON.stringify(merged)).toString("base64url");
}

export function decodeConfig(encoded: string): AddonConfig {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<AddonConfig>;
    return {
      providers: parsed.providers ?? DEFAULT_CONFIG.providers,
      showboxCookie: parsed.showboxCookie ?? DEFAULT_CONFIG.showboxCookie,
      formatter: {
        nameTemplate: parsed.formatter?.nameTemplate ?? DEFAULT_CONFIG.formatter.nameTemplate,
        descTemplate: parsed.formatter?.descTemplate ?? DEFAULT_CONFIG.formatter.descTemplate,
      },
      timeout: parsed.timeout ?? DEFAULT_CONFIG.timeout,
      resolutionFilter: parsed.resolutionFilter ?? DEFAULT_CONFIG.resolutionFilter,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function parseStreamId(type: string, id: string): {
  tmdbId: string;
  imdbId: string | null;
  season: number | null;
  episode: number | null;
} {
  let cleanId = id;
  let season: number | null = null;
  let episode: number | null = null;

  if (type === "series") {
    const parts = id.split(":");
    cleanId = parts[0];
    season = parts[1] ? parseInt(parts[1], 10) : null;
    episode = parts[2] ? parseInt(parts[2], 10) : null;
  }

  const isImdb = cleanId.startsWith("tt");
  return {
    tmdbId: isImdb ? cleanId : cleanId,
    imdbId: isImdb ? cleanId : null,
    season,
    episode,
  };
}
