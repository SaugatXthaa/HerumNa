import { Stream } from "../types.js";

const VIDSRC_BASE = "https://vidsrc.to";
const VIDSRC_ALT = "https://vidsrc.me";
const VIDSRC_API_KEY = "";

interface VidSrcEmbedSource {
  id?: string;
  result?: {
    sources?: Array<{ file?: string; type?: string; quality?: string }>;
  };
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function tryVidSrcApi(
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null,
  baseUrl: string,
  timeout: number
): Promise<Stream[]> {
  const cleanId = tmdbId.replace(/^tt/, "");
  const isSeries = type === "series";
  const mediaType = isSeries ? "tv" : "movie";

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Accept: "*/*",
    Referer: `${baseUrl}/`,
    Origin: baseUrl,
  };

  try {
    let apiUrl: string;
    if (isSeries && season !== null && episode !== null) {
      apiUrl = `${baseUrl}/vidsrc-api/${mediaType}/${cleanId}?s=${season}&e=${episode}`;
    } else {
      apiUrl = `${baseUrl}/vidsrc-api/${mediaType}/${cleanId}`;
    }

    const res = await fetchWithTimeout(apiUrl, { headers }, timeout);
    if (!res.ok) return [];
    const data = (await res.json()) as Record<string, unknown>;
    const sources = Array.isArray(data.sources) ? data.sources as Array<Record<string, string>> : [];

    return sources
      .filter((s) => s.file && s.file.startsWith("http"))
      .map((s) => ({
        name: `VidSrc ${s.quality ?? "HD"}`,
        title: "",
        url: s.file,
        quality: s.quality ?? "HD",
        provider: "VidSrc",
        lang: "en",
        headers: { Referer: `${baseUrl}/` },
      }));
  } catch {
    return [];
  }
}

async function tryVidSrcEmbed(
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null,
  timeout: number
): Promise<Stream[]> {
  const cleanId = tmdbId.replace(/^tt/, "");
  const isSeries = type === "series";

  const streams: Stream[] = [];
  const servers = [
    { url: VIDSRC_BASE, name: "VidSrc" },
    { url: VIDSRC_ALT, name: "VidSrc.me" },
  ];

  for (const server of servers) {
    try {
      let embedPath: string;
      if (isSeries && season !== null && episode !== null) {
        embedPath = `/embed/tv/${cleanId}/${season}/${episode}`;
      } else {
        embedPath = `/embed/movie/${cleanId}`;
      }

      const embedUrl = `${server.url}${embedPath}`;
      const res = await fetchWithTimeout(
        embedUrl,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "text/html,*/*",
            Referer: server.url,
          },
        },
        timeout
      );

      if (!res.ok) continue;
      const html = await res.text();

      const m3u8Matches = html.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/g) ?? [];
      const mp4Matches = html.match(/https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*/g) ?? [];
      const allMatches = [...new Set([...m3u8Matches, ...mp4Matches])];

      for (const url of allMatches.slice(0, 3)) {
        streams.push({
          name: `${server.name} ${url.includes(".m3u8") ? "HLS" : "MP4"}`,
          title: "",
          url,
          quality: "HD",
          provider: server.name,
          lang: "en",
          headers: { Referer: `${server.url}/` },
        });
      }
    } catch {
      continue;
    }
  }

  return streams;
}

export async function getVidSrcStreams(
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null,
  timeout: number
): Promise<Stream[]> {
  const [apiStreams, embedStreams] = await Promise.allSettled([
    tryVidSrcApi(tmdbId, type, season, episode, VIDSRC_BASE, timeout),
    tryVidSrcEmbed(tmdbId, type, season, episode, timeout),
  ]);

  const results: Stream[] = [];
  if (apiStreams.status === "fulfilled") results.push(...apiStreams.value);
  if (embedStreams.status === "fulfilled") results.push(...embedStreams.value);

  return results;
}
