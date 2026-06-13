import { AddonConfig, PROVIDER_LIST } from "./types.js";
import { encodeConfig } from "./config.js";

export interface AddonManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo: string;
  background: string;
  types: string[];
  resources: string[];
  idPrefixes: string[];
  behaviorHints: {
    configurable: boolean;
    configurationURL: string;
  };
  catalogs: never[];
}

export function buildManifest(config: AddonConfig, baseUrl: string): AddonManifest {
  const encodedConfig = encodeConfig(config);
  const enabledProviders = PROVIDER_LIST.filter((p) => config.providers.includes(p.id));
  const providerNames = enabledProviders.map((p) => p.name).join(", ");

  return {
    id: "com.herumna.addon",
    version: "1.0.0",
    name: "Herum Na",
    description: `Multi-source streaming addon. Active: ${providerNames || "none"}`,
    logo: "https://i.postimg.cc/DZpW6Xfb/4khdhub.png",
    background: "https://i.postimg.cc/DwpqLJWV/allanime.png",
    types: ["movie", "series"],
    resources: ["stream"],
    idPrefixes: ["tt", "tmdb"],
    behaviorHints: {
      configurable: true,
      configurationURL: `${baseUrl}/${encodedConfig}/configure`,
    },
    catalogs: [],
  };
}
