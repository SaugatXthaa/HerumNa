import { Stream } from "../types.js";

const PEACHIFY_BASE = "https://peachify.top";
const TMDB_API_KEY = "1c29a5198ee1854bd5eb45dbe8d17d92";

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getTmdbTitle(tmdbId: string, type: string, timeout: number): Promise<string> {
  try {
    const endpoint = type === "series" ? "tv" : "movie";
    const res = await fetchWithTimeout(
      `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`,
      {},
      timeout
    );
    if (!res.ok) return "";
    const data = (await res.json()) as Record<string, unknown>;
    return String(type === "series" ? data.name ?? "" : data.title ?? "");
  } catch {
    return "";
  }
}

export async function getPeachifyStreams(
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null,
  timeout: number
): Promise<Stream[]> {
  try {
    const cleanId = tmdbId.replace(/^tt/, "");
    const isSeries = type === "series";
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json, text/html, */*",
      Referer: PEACHIFY_BASE,
      Origin: PEACHIFY_BASE,
    };

    let apiUrl: string;
    if (isSeries && season !== null && episode !== null) {
      apiUrl = `${PEACHIFY_BASE}/api/stream/tv/${cleanId}/${season}/${episode}`;
    } else {
      apiUrl = `${PEACHIFY_BASE}/api/stream/movie/${cleanId}`;
    }

    const res = await fetchWithTimeout(apiUrl, { headers }, timeout);
    if (!res.ok) return [];

    const data = (await res.json()) as Record<string, unknown>;
    const streams: Stream[] = [];
    const title = await getTmdbTitle(cleanId, type, timeout);

    if (Array.isArray(data.streams)) {
      for (const s of data.streams as Array<Record<string, unknown>>) {
        const url = String(s.url ?? s.link ?? "");
        if (!url.startsWith("http")) continue;
        const quality = String(s.quality ?? s.resolution ?? "HD");
        streams.push({
          name: `Peachify ${quality}`.trim(),
          title,
          url,
          quality,
          size: s.size ? String(s.size) : undefined,
          provider: "Peachify",
          lang: s.lang ? String(s.lang) : "en",
          headers: { Referer: PEACHIFY_BASE, "User-Agent": headers["User-Agent"] },
        });
      }
    } else if (data.url && String(data.url).startsWith("http")) {
      streams.push({
        name: "Peachify HD",
        title,
        url: String(data.url),
        quality: "HD",
        provider: "Peachify",
        lang: "en",
        headers: { Referer: PEACHIFY_BASE },
      });
    } else if (data.link && String(data.link).startsWith("http")) {
      streams.push({
        name: "Peachify HD",
        title,
        url: String(data.link),
        quality: "HD",
        provider: "Peachify",
        lang: "en",
        headers: { Referer: PEACHIFY_BASE },
      });
    }

    return streams;
  } catch {
    return [];
  }
}
