import { Stream } from "../types.js";

const SHOWBOX_BASE = "https://showbox.codiv.dpdns.org";
const TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";

interface ShowBoxStream {
  url?: string;
  quality?: string;
  size?: string | number;
  speed?: number | null;
}

interface ShowBoxVersion {
  name?: string;
  size?: string | number;
  streams?: ShowBoxStream[];
}

interface ShowBoxResponse {
  success?: boolean;
  data?: ShowBoxVersion[];
}

interface ShowBoxLoginResponse {
  success?: boolean;
  data?: {
    token?: string;
    jwt?: string;
    access_token?: string;
  };
  token?: string;
  jwt?: string;
  access_token?: string;
  message?: string;
  error?: string;
}

async function getTmdbDetails(
  tmdbId: string,
  type: string,
  timeout: number
): Promise<{ title: string; year: number | null }> {
  const endpoint = type === "series" ? "tv" : "movie";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}`,
      { signal: controller.signal }
    );
    if (!res.ok) return { title: `Title ${tmdbId}`, year: null };
    const data = (await res.json()) as Record<string, unknown>;
    const title = (type === "series" ? data.name : data.title) as string;
    const dateStr = (type === "series" ? data.first_air_date : data.release_date) as string | undefined;
    const year = dateStr ? parseInt(dateStr.split("-")[0], 10) : null;
    return { title, year };
  } catch {
    return { title: `Title ${tmdbId}`, year: null };
  } finally {
    clearTimeout(timer);
  }
}

function formatSize(size: string | number | undefined): string | undefined {
  if (!size) return undefined;
  if (typeof size === "string" && (size.includes("GB") || size.includes("MB"))) return size;
  if (typeof size === "number") {
    const gb = size / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = size / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
  return String(size);
}

function mapQuality(q: string): string {
  const upper = (q || "").toUpperCase();
  if (upper === "ORIGINAL" || upper === "ORIGINAL_QUALITY") return "Original";
  if (upper === "4K" || upper === "2160P") return "4K";
  if (upper === "1440P" || upper === "2K") return "1440p";
  if (upper === "1080P" || upper === "FULLHD") return "1080p";
  if (upper === "720P" || upper === "HD") return "720p";
  if (upper === "480P" || upper === "SD") return "480p";
  if (upper === "360P") return "360p";
  const match = q.match(/(\d{3,4})[pP]/);
  if (match) return `${match[1]}p`;
  return q || "Unknown";
}

const QUALITY_ORDER: Record<string, number> = {
  Original: 6, "4K": 5, "1440p": 4, "1080p": 3, "720p": 2, "480p": 1, "360p": 0,
};

/** Try to login to ShowBox with email + password and return a fresh JWT. */
export async function refreshShowBoxToken(
  email: string,
  password: string,
  timeout: number
): Promise<{ success: boolean; token?: string; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const LOGIN_ENDPOINTS = [
    `${SHOWBOX_BASE}/user/login`,
    `${SHOWBOX_BASE}/api/user/login`,
    `${SHOWBOX_BASE}/api/login`,
    `${SHOWBOX_BASE}/login`,
  ];

  const HEADERS = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Origin: SHOWBOX_BASE,
    Referer: `${SHOWBOX_BASE}/login`,
  };

  try {
    for (const url of LOGIN_ENDPOINTS) {
      let res: Response;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
      } catch {
        continue;
      }

      if (!res.ok) continue;

      const raw = (await res.json()) as ShowBoxLoginResponse;

      // Extract JWT from common response shapes
      const token =
        raw.data?.token ??
        raw.data?.jwt ??
        raw.data?.access_token ??
        raw.token ??
        raw.jwt ??
        raw.access_token;

      if (token) {
        return { success: true, token };
      }

      // Some APIs return the full JWT in a Set-Cookie header
      const setCookie = res.headers.get("set-cookie");
      if (setCookie) {
        const jwtMatch = setCookie.match(/token=([^;]+)/);
        if (jwtMatch) return { success: true, token: jwtMatch[1] };
        const eyMatch = setCookie.match(/(eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/);
        if (eyMatch) return { success: true, token: eyMatch[1] };
      }

      // API responded OK but no token — indicate wrong credentials
      const errMsg = raw.message ?? raw.error ?? "Login failed — check credentials";
      return { success: false, error: String(errMsg) };
    }

    return { success: false, error: "Could not reach ShowBox login endpoint" };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return { success: false, error: "Request timed out" };
    }
    return { success: false, error: (err as Error).message ?? "Connection failed" };
  } finally {
    clearTimeout(timer);
  }
}

export async function getShowBoxStreams(
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null,
  cookie: string,
  timeout: number
): Promise<Stream[]> {
  if (!cookie) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const isImdb = tmdbId.startsWith("tt");
    let numericId: string;
    if (isImdb) {
      const findRes = await fetch(
        `https://api.themoviedb.org/3/find/${tmdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`
      );
      if (findRes.ok) {
        const findData = (await findRes.json()) as Record<string, unknown>;
        const results = type === "series"
          ? (findData.tv_results as Array<Record<string, unknown>>) ?? []
          : (findData.movie_results as Array<Record<string, unknown>>) ?? [];
        numericId = results.length > 0 ? String(results[0].id) : tmdbId.replace(/^tt/, "");
      } else {
        numericId = tmdbId.replace(/^tt/, "");
      }
    } else {
      numericId = tmdbId;
    }

    const encodedCookie = encodeURIComponent(cookie);
    let url: string;

    if (type === "series" && season !== null && episode !== null) {
      url = `${SHOWBOX_BASE}/tv/${numericId}/${season}/${episode}?cookie=${encodedCookie}`;
    } else {
      url = `${SHOWBOX_BASE}/movie/${numericId}?cookie=${encodedCookie}`;
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json, */*",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
    });

    if (!res.ok) return [];
    const data = (await res.json()) as ShowBoxResponse;
    if (!data.success || !Array.isArray(data.data) || data.data.length === 0) return [];

    const tmdbDetails = await getTmdbDetails(numericId, type, timeout);
    const streams: Stream[] = [];

    data.data.forEach((version, vIdx) => {
      if (!Array.isArray(version.streams)) return;
      version.streams.forEach((s) => {
        if (!s.url || !s.url.startsWith("http")) return;
        const quality = mapQuality(s.quality ?? "");
        let name = "ShowBox";
        if ((data.data ?? []).length > 1) name += ` V${vIdx + 1}`;
        name += ` ${quality}`;

        streams.push({
          name,
          title: tmdbDetails.title,
          url: s.url,
          quality,
          size: formatSize(s.size),
          provider: "ShowBox",
          lang: "en",
        });
      });
    });

    return streams.sort((a, b) => (QUALITY_ORDER[b.quality ?? ""] ?? -1) - (QUALITY_ORDER[a.quality ?? ""] ?? -1));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
