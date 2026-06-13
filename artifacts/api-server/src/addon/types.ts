export interface AddonConfig {
  providers: string[];
  showboxCookie: string;
  formatter: {
    nameTemplate: string;
    descTemplate: string;
  };
  timeout: number;
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

export const DEFAULT_CONFIG: AddonConfig = {
  providers: ["4khdhub", "showbox", "dahmermovies", "playimdb", "vidsrc", "peachify"],
  showboxCookie:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3ODA5ODQ4MzcsIm5iZiI6MTc4MDk4NDgzNywiZXhwIjoxODEyMDg4ODU3LCJkYXRhIjp7InVpZCI6MTcxMDMzMCwidG9rZW4iOiIwZGU0MTk5NzUyNjcxNzQ5OTc5NTQ0MDkyZjg0Y2RjMSJ9fQ.AmaXtqsHVjYi93mneIqUn28JJJB8D2KZA6Igv2KwVL0",
  formatter: {
    nameTemplate: "{provider} {quality}",
    descTemplate: "{size} {lang}",
  },
  timeout: 15000,
};

export const PROVIDER_LIST = [
  { id: "4khdhub", name: "4KHDHub", description: "Direct 4K/HD links via Mushi backend", logo: "https://i.postimg.cc/DZpW6Xfb/4khdhub.png" },
  { id: "showbox", name: "ShowBox", description: "ShowBox multi-quality streams", logo: "https://files.catbox.moe/4mdxz9.jpeg" },
  { id: "dahmermovies", name: "DahmerMovies", description: "High quality direct links", logo: "https://image.similarpng.com/file/similarpng/very-thumbnail/2021/05/Letter-D-logo-design-template-with-geometric-shape-style-on-transparent-background-PNG.png" },
  { id: "playimdb", name: "PlayIMDb", description: "Lightning fast streams", logo: "https://www.google.com/s2/favicons?domain=playimdb.com&sz=256" },
  { id: "vidsrc", name: "VidSrc", description: "VidSrc multi-server streams", logo: "https://vidsrc.to/favicon.ico" },
  { id: "peachify", name: "Peachify", description: "Peachify direct streams", logo: "https://www.google.com/s2/favicons?domain=peachify.top&sz=256" },
];
