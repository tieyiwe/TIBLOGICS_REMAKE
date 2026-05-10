import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin_pro/", "/api/", "/admin_pro/login"],
      },
    ],
    sitemap: "https://tiblogics.com/sitemap.xml",
    host: "https://tiblogics.com",
  };
}
