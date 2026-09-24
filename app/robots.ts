import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/** Search engines and AI assistants are both welcome; the assistants are named
 *  explicitly so there is no doubt they may read and cite the site. */
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot",
  "anthropic-ai", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended",
  "Bingbot", "CCBot", "Meta-ExternalAgent", "Amazonbot", "DuckAssistBot", "cohere-ai", "YouBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_CRAWLERS.map((bot) => ({ userAgent: bot, allow: "/" })),
    ],
    sitemap: siteUrl + "/sitemap.xml",
    host: siteUrl,
  };
}
