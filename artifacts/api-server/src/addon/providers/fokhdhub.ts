import { Stream } from "../types.js";

const MUSHI_BACKEND = "https://piratezoro9-mushi-master.hf.space";
const AUTH_KEY = "Shikari@95";
const TMDB_API_KEY = "1c29a5198ee1854bd5eb45dbe8d17d92";

async function mushiFetch(
  path: string,
  body: Record<string, unknown>,
  timeout: number
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${MUSHI_BACKEND}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": AUTH_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getTmdbDetails(
  id: string,
  type: string,
  timeout: number
): Promise<{ title: string; year: number | null; numericId: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const isImdb = id.startsWith("tt");
    if (isImdb) {
      const res = await fetch(
        `https://api.themoviedb.org/3/find/${id}?api_key=${TMDB_API_KEY}&external_source=imdb_id`,
        { signal: controller.signal }
      );
      if (!res.ok) return { title: id, year: null, numericId: id };
      const data = (await res.json()) as Record<string, unknown>;
      const results = (type === "series"
        ? (data.tv_results as Array<Record<string, unknown>>)
        : (data.movie_results as Array<Record<string, unknown>>)) ?? [];
      if (results.length === 0) return { title: id, year: null, numericId: id };
      const item = results[0];
      const title = String((type === "series" ? item.name : item.title) ?? "");
      const dateStr = String((type === "series" ? item.first_air_date : item.release_date) ?? "");
      const year = dateStr ? parseInt(dateStr.split("-")[0], 10) : null;
      const numericId = String(item.id ?? id);
      return { title, year, numericId };
    }

    const endpoint = type === "series" ? "tv" : "movie";
    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${TMDB_API_KEY}`,
      { signal: controller.signal }
    );
    if (!res.ok) return { title: id, year: null, numericId: id };
    const data = (await res.json()) as Record<string, unknown>;
    const title = String((type === "series" ? data.name : data.title) ?? "");
    const dateStr = String((type === "series" ? data.first_air_date : data.release_date) ?? "");
    const year = dateStr ? parseInt(dateStr.split("-")[0], 10) : null;
    return { title, year, numericId: id };
  } catch {
    return { title: id, year: null, numericId: id };
  } finally {
    clearTimeout(timer);
  }
}

async function mushibackendExtract(
  site: string,
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null,
  title: string,
  year: number | null,
  timeout: number
): Promise<Array<Record<string, unknown>>> {
  const streamType = type === "series" ? "tv" : "movie";

  const searchBody: Record<string, unknown> = {
    site,
    query: title,
    year: year ?? 0,
    type: streamType,
    season: season ?? 0,
    episode: episode ?? 0,
  };

  const searchData = (await mushiFetch("/search", searchBody, timeout)) as Record<string, unknown>;
  if (!searchData?.success || !Array.isArray(searchData.results) || searchData.results.length === 0) {
    return [];
  }

  const topResult = (searchData.results as Array<Record<string, unknown>>)[0];
  const pageUrl = String(topResult.url ?? "");
  if (!pageUrl.startsWith("http")) return [];

  const extractBody: Record<string, unknown> = {
    site,
    url: pageUrl,
    type: streamType,
    tmdb_id: String(tmdbId),
    season: season ?? 0,
    episode: episode ?? 0,
  };

  const extractData = (await mushiFetch("/extract", extractBody, timeout)) as Record<string, unknown>;
  if (!extractData?.success || !Array.isArray(extractData.streams)) return [];

  return extractData.streams as Array<Record<string, unknown>>;
}

export async function get4KHDHubStreams(
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null,
  timeout: number
): Promise<Stream[]> {
  try {
    const tmdbDetails = await getTmdbDetails(tmdbId, type, Math.min(timeout, 8000));
    const streams = await mushibackendExtract(
      "4khdhub",
      tmdbDetails.numericId,
      type,
      season,
      episode,
      tmdbDetails.title,
      tmdbDetails.year,
      timeout
    );

    return streams.map((s) => ({
      name: `4KHDHub ${s.quality ?? ""}`.trim(),
      title: String(s.title ?? ""),
      url: String(s.url ?? ""),
      quality: String(s.quality ?? ""),
      size: undefined,
      provider: "4KHDHub",
      lang: "en",
      headers: s.headers as Record<string, string> | undefined,
    })).filter((s) => s.url.startsWith("http"));
  } catch {
    return [];
  }
}

export async function get4KHDHubNewStreams(
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null,
  timeout: number
): Promise<Stream[]> {
  try {
    const tmdbDetails = await getTmdbDetails(tmdbId, type, Math.min(timeout, 8000));
    const streams = await mushibackendExtract(
      "4khdhubnew",
      tmdbDetails.numericId,
      type,
      season,
      episode,
      tmdbDetails.title,
      tmdbDetails.year,
      timeout
    );

    return streams.map((s) => ({
      name: `4KHDHub+ ${s.quality ?? ""}`.trim(),
      title: String(s.title ?? ""),
      url: String(s.url ?? ""),
      quality: String(s.quality ?? ""),
      size: undefined,
      provider: "4KHDHub+",
      lang: "en",
      headers: s.headers as Record<string, string> | undefined,
    })).filter((s) => s.url.startsWith("http"));
  } catch {
    return [];
  }
}
