import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/register", "/tentang-kami", "/privasi", "/hubungi-kami"],
        disallow: ["/dashboard", "/dashboard/", "/api/"],
      },
    ],
    sitemap: "https://mp.jobenapp.cloud/sitemap.xml",
  };
}
