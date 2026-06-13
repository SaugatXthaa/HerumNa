import { Stream } from "../types.js";

const DAHMER_API = "https://a.111477.xyz";
const DAHMER_WORKER = "https://p.111477.xyz/bulk?u=";
const TMDB_API_KEY = "1c29a5198ee1854bd5eb45dbe8d17d92";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36";

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getTmdbDetails(
  tmdbId: string,
  type: string,
  timeout: number
): Promise<{ title: string; year: number | null }> {
  try {
    const endpoint = type === "series" ? "tv" : "movie";
    const res = await fetchWithTimeout(
      `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`,
      {},
      timeout
    );
    if (!res.ok) return { title: `Title ${tmdbId}`, year: null };
    const data = (await res.json()) as Record<string, unknown>;
    const title = (type === "series" ? data.name : data.title) as string;
    const dateStr = (type === "series" ? data.first_air_date : data.release_date) as string | undefined;
    const year = dateStr ? parseInt(dateStr.split("-")[0], 10) : null;
    return { title, year };
  } catch {
    return { title: `Title ${tmdbId}`, year: null };
  }
}

function padNum(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export async function getDahmerMoviesStreams(
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null,
  timeout: number
): Promise<Stream[]> {
  try {
    const cleanId = tmdbId.replace(/^tt/, "");
    const isSeries = type === "series";
    const tmdbDetails = await getTmdbDetails(cleanId, type, timeout);

    let searchUrl: string;
    if (isSeries && season !== null && episode !== null) {
      const s = padNum(season);
      const e = padNum(episode);
      searchUrl = `${DAHMER_API}/tv/${cleanId}/S${s}E${e}`;
    } else {
      searchUrl = `${DAHMER_API}/movie/${cleanId}`;
    }

    const headers = {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: DAHMER_API,
    };

    const res = await fetchWithTimeout(searchUrl, { headers }, timeout);
    if (!res.ok) return [];

    const data = (await res.json()) as Record<string, unknown>;
    const streams: Stream[] = [];

    if (data.success && Array.isArray(data.streams)) {
      for (const s of data.streams as Array<Record<string, unknown>>) {
        const url = String(s.url ?? "");
        if (!url.startsWith("http")) continue;
        const quality = String(s.quality ?? s.resolution ?? "HD");
        streams.push({
          name: `DahmerMovies ${quality}`.trim(),
          title: tmdbDetails.title,
          url,
          quality,
          size: s.size ? String(s.size) : undefined,
          provider: "DahmerMovies",
          lang: s.lang ? String(s.lang) : "en",
          headers: { "User-Agent": UA, Referer: DAHMER_API },
        });
      }
    } else if (data.links && Array.isArray(data.links)) {
      for (const link of data.links as string[]) {
        if (!link.startsWith("http")) continue;
        streams.push({
          name: "DahmerMovies",
          title: tmdbDetails.title,
          url: link,
          quality: "HD",
          provider: "DahmerMovies",
          headers: { "User-Agent": UA, Referer: DAHMER_API },
        });
      }
    }

    return streams;
  } catch {
    return [];
  }
}
