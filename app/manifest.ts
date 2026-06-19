import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Senate POS — The Complete Restaurant Operating System",
    short_name: "Senate POS",
    description:
      "Enterprise-grade restaurant operating system: POS, KDS, inventory, staff, and reporting in one platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#081120",
    theme_color: "#081120",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
