import type { MetadataRoute } from "next";

const SITE_URL = "https://senatepos.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const sections = ["", "#ecosystem", "#screenshots", "#features", "#pricing", "#demo"];
  return sections.map((section) => ({
    url: `${SITE_URL}/${section}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: section === "" ? 1 : 0.7,
  }));
}
