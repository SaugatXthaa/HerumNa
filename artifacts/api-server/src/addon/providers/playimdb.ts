import { Stream } from "../types.js";

const BASE_API = "https://streamdata.vaplayer.ru/api.php";

const MOBILE_UAS = [
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; Samsung Galaxy S23) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
];

interface PlayIMDbResponse {
  status_code?: number | string;
  data?: {
    title?: string;
    quality?: string;
    links?: string[];
    subtitles?: Array<{ code?: string; lang?: string; url?: string }>;
  };
}

export async function getPlayIMDbStreams(
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null,
  timeout: number
): Promise<Stream[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const cleanId = tmdbId.replace(/^tt/, "");
    const isSeries = type === "series";
    const ua = MOBILE_UAS[Math.floor(Math.random() * MOBILE_UAS.length)];

    const headers = {
      origin: "https://playimdb.com",
      referer: "https://playimdb.com/",
      "user-agent": ua,
    };

    let url = `${BASE_API}?tmdb=${cleanId}&type=${isSeries ? "tv" : "movie"}`;
    if (isSeries && season !== null && episode !== null) {
      url += `&season=${season}&episode=${episode}`;
    }

    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return [];

    const data = (await res.json()) as PlayIMDbResponse;
    if (
      (data.status_code !== 200 && data.status_code !== "200") ||
      !data.data?.links?.length
    ) return [];

    const streams: Stream[] = [];
    const qualityLabel = resolveQuality(data.data.quality ?? "");
    const title = data.data.title ?? "";

    const subtitles = (data.data.subtitles ?? [])
      .filter((s) => s.url)
      .map((s) => ({
        id: s.code ?? s.lang ?? "en",
        url: s.url ?? "",
        lang: s.lang ?? s.code ?? "en",
      }));

    data.data.links.forEach((link, idx) => {
      if (!link.startsWith("http")) return;
      const serverName = resolveServerName(link, idx);
      const name = `PlayIMDb ${qualityLabel} (${serverName})`;
      streams.push({
        name,
        title: title + (isSeries && season !== null ? ` S${season}E${episode}` : ""),
        url: link,
        quality: qualityLabel,
        provider: "PlayIMDb",
        lang: "en",
        headers,
        subtitles: subtitles.length > 0 ? subtitles : undefined,
      });
    });

    return streams;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function resolveQuality(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("2160p") || lower.includes("4k")) return "4K";
  if (lower.includes("1080p")) return "1080p";
  if (lower.includes("720p")) return "720p";
  if (lower.includes("480p")) return "480p";
  return "HD";
}

function resolveServerName(url: string, idx: number): string {
  if (url.includes("putgate.com")) return "PutGate";
  if (url.includes("onlinevisibilitysystem")) return "OVS";
  if (url.includes("remoteincome")) return "Remote";
  return `Server ${idx + 1}`;
}
