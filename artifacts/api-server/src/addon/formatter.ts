import { Stream, FormattedStream } from "./types.js";

export function applyFormatter(
  stream: Stream,
  nameTemplate: string,
  descTemplate: string
): FormattedStream {
  const vars: Record<string, string> = {
    provider: stream.provider ?? "",
    quality: stream.quality ?? "",
    size: stream.size ?? "",
    lang: stream.lang ?? "",
    type: getStreamType(stream.url),
    name: stream.name ?? "",
    title: stream.title ?? "",
  };

  const name = renderTemplate(nameTemplate, vars) || stream.name;
  const description = renderTemplate(descTemplate, vars) || stream.title || "";

  const result: FormattedStream = {
    name,
    url: stream.url,
  };

  if (description) result.description = description;
  if (stream.headers && Object.keys(stream.headers).length > 0) {
    result.headers = stream.headers;
    result.behaviorHints = {
      notWebReady: false,
      proxyHeaders: { request: stream.headers },
    };
  }
  if (stream.subtitles && stream.subtitles.length > 0) {
    result.subtitles = stream.subtitles;
  }
  if (stream.behaviorHints) {
    result.behaviorHints = { ...result.behaviorHints, ...stream.behaviorHints };
  }

  return result;
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "").replace(/\s+/g, " ").trim();
}

function getStreamType(url: string): string {
  if (url.includes(".m3u8")) return "HLS";
  if (url.includes(".mp4")) return "MP4";
  if (url.includes(".mkv")) return "MKV";
  return "HTTP";
}

export function isValidStreamUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
