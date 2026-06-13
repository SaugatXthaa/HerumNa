export interface AddonConfig {
  providers: string[];
  showboxCookie: string;
  formatter: {
    nameTemplate: string;
    descTemplate: string;
  };
  timeout: number;
  resolutionFilter: string[];
}

export interface ParsedId {
  id: string;
  season?: number;
  episode?: number;
  isImdb: boolean;
}

export interface Stream {
  name: string;
  title?: string;
  url: string;
  quality?: string;
  size?: string;
  provider: string;
  lang?: string;
  headers?: Record<string, string>;
  subtitles?: Array<{ id: string; url: string; lang: string }>;
  behaviorHints?: {
    notWebReady?: boolean;
    proxyHeaders?: { request?: Record<string, string> };
  };
}

export interface FormattedStream {
  name: string;
  description?: string;
  url: string;
  headers?: Record<string, string>;
  subtitles?: Array<{ id: string; url: string; lang: string }>;
  behaviorHints?: {
    notWebReady?: boolean;
    proxyHeaders?: { request?: Record<string, string> };
  };
}

export const RESOLUTION_OPTIONS = [
  { id: "4k",    label: "4K / 2160p",  keywords: ["4k", "2160", "uhd", "ultrahd"] },
  { id: "2k",    label: "2K / 1440p",  keywords: ["2k", "1440", "qhd"] },
  { id: "1080p", label: "1080p / FHD", keywords: ["1080", "fhd", "fullhd"] },
  { id: "720p",  label: "720p / HD",   keywords: ["720", "hd"] },
  { id: "480p",  label: "480p / SD",   keywords: ["480", "sd"] },
];

export function qualityRank(quality: string | undefined): number {
  if (!quality) return -1;
  const q = quality.toLowerCase();
  if (q.includes("4k") || q.includes("2160") || q.includes("uhd")) return 50;
  if (q.includes("2k") || q.includes("1440") || q.includes("qhd")) return 40;
  if (q.includes("1080") || q.includes("fhd")) return 30;
  if (q.includes("720")) return 20;
  if (q.includes("480")) return 10;
  if (q.includes("360")) return 5;
  return -1;
}

export function matchesResolutionFilter(quality: string | undefined, filter: string[]): boolean {
  if (filter.length === 0) return true;
  if (!quality) return true;
  const q = quality.toLowerCase();
  return filter.some((f) => {
    const option = RESOLUTION_OPTIONS.find((o) => o.id === f);
    if (!option) return false;
    return option.keywords.some((kw) => q.includes(kw));
  });
}

export const DEFAULT_CONFIG: AddonConfig = {
  providers: ["4khdhub", "showbox", "dahmermovies", "playimdb", "vidsrc", "peachify"],
  showboxCookie:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3ODA5ODQ4MzcsIm5iZiI6MTc4MDk4NDgzNywiZXhwIjoxODEyMDg4ODU3LCJkYXRhIjp7InVpZCI6MTcxMDMzMCwidG9rZW4iOiIwZGU0MTk5NzUyNjcxNzQ5OTc5NTQ0MDkyZjg0Y2RjMSJ9fQ.AmaXtqsHVjYi93mneIqUn28JJJB8D2KZA6Igv2KwVL0",
  formatter: {
    nameTemplate: "{provider} {quality}",
    descTemplate: "{size} {lang}",
  },
  timeout: 15000,
  resolutionFilter: [],
};

export const PROVIDER_LIST = [
  { id: "4khdhub",      name: "4KHDHub",      description: "Direct 4K/HD links via Mushi backend",    logo: "https://i.postimg.cc/DZpW6Xfb/4khdhub.png",                                                                            healthUrl: "https://piratezoro9-mushi-master.hf.space/health" },
  { id: "showbox",      name: "ShowBox",       description: "ShowBox multi-quality streams",           logo: "https://files.catbox.moe/4mdxz9.jpeg",                                                                                 healthUrl: "https://showbox.codiv.dpdns.org" },
  { id: "dahmermovies", name: "DahmerMovies",  description: "High quality direct links",               logo: "https://image.similarpng.com/file/similarpng/very-thumbnail/2021/05/Letter-D-logo-design-template-with-geometric-shape-style-on-transparent-background-PNG.png", healthUrl: "https://a.111477.xyz" },
  { id: "playimdb",     name: "PlayIMDb",      description: "Lightning fast streams",                  logo: "https://www.google.com/s2/favicons?domain=playimdb.com&sz=256",                                                        healthUrl: "https://playimdb.com" },
  { id: "vidsrc",       name: "VidSrc",        description: "VidSrc multi-server streams",             logo: "https://vidsrc.to/favicon.ico",                                                                                        healthUrl: "https://vidsrc.to" },
  { id: "peachify",     name: "Peachify",       description: "Peachify direct streams",                logo: "https://www.google.com/s2/favicons?domain=peachify.top&sz=256",                                                        healthUrl: "https://peachify.top" },
];
