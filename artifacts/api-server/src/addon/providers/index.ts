import { Stream, AddonConfig } from "../types.js";
import { get4KHDHubStreams, get4KHDHubNewStreams } from "./fokhdhub.js";
import { getShowBoxStreams } from "./showbox.js";
import { getDahmerMoviesStreams } from "./dahmermovies.js";
import { getPlayIMDbStreams } from "./playimdb.js";
import { getVidSrcStreams } from "./vidsrc.js";
import { getPeachifyStreams } from "./peachify.js";

export interface ProviderTask {
  id: string;
  fn: () => Promise<Stream[]>;
}

export function buildProviderTasks(
  config: AddonConfig,
  tmdbId: string,
  type: string,
  season: number | null,
  episode: number | null
): ProviderTask[] {
  const tasks: ProviderTask[] = [];
  const enabled = new Set(config.providers);
  const timeout = config.timeout ?? 15000;

  if (enabled.has("4khdhub")) {
    tasks.push({
      id: "4khdhub",
      fn: () => get4KHDHubStreams(tmdbId, type, season, episode, timeout),
    });
  }

  if (enabled.has("4khdhubnew")) {
    tasks.push({
      id: "4khdhubnew",
      fn: () => get4KHDHubNewStreams(tmdbId, type, season, episode, timeout),
    });
  }

  if (enabled.has("showbox")) {
    tasks.push({
      id: "showbox",
      fn: () => getShowBoxStreams(tmdbId, type, season, episode, config.showboxCookie, timeout),
    });
  }

  if (enabled.has("dahmermovies")) {
    tasks.push({
      id: "dahmermovies",
      fn: () => getDahmerMoviesStreams(tmdbId, type, season, episode, timeout),
    });
  }

  if (enabled.has("playimdb")) {
    tasks.push({
      id: "playimdb",
      fn: () => getPlayIMDbStreams(tmdbId, type, season, episode, timeout),
    });
  }

  if (enabled.has("vidsrc")) {
    tasks.push({
      id: "vidsrc",
      fn: () => getVidSrcStreams(tmdbId, type, season, episode, timeout),
    });
  }

  if (enabled.has("peachify")) {
    tasks.push({
      id: "peachify",
      fn: () => getPeachifyStreams(tmdbId, type, season, episode, timeout),
    });
  }

  return tasks;
}

export async function fetchAllStreams(tasks: ProviderTask[]): Promise<Stream[]> {
  const results = await Promise.allSettled(tasks.map((t) => t.fn()));
  const all: Stream[] = [];
  results.forEach((r) => {
    if (r.status === "fulfilled") all.push(...r.value);
  });
  return all;
}
