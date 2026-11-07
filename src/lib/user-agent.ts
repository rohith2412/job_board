export type Device = "mobile" | "tablet" | "desktop";

export function parseUserAgent(ua: string): { device: Device; browser: string; os: string } {
  const device: Device = /ipad|tablet|(android(?!.*mobile))/i.test(ua)
    ? "tablet"
    : /mobi|iphone|ipod|android/i.test(ua)
      ? "mobile"
      : "desktop";

  // Order matters: in-app browsers and Edge, Opera and Samsung all also report "Chrome" or "Safari".
  const browser = /linkedinapp/i.test(ua)
    ? "LinkedIn app"
    : /instagram/i.test(ua)
      ? "Instagram app"
      : /fban|fbav|fb_iab/i.test(ua)
        ? "Facebook app"
        : /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung Internet"
        : /fxios|firefox/i.test(ua)
          ? "Firefox"
          : /crios|chrome/i.test(ua)
            ? "Chrome"
            : /safari/i.test(ua)
              ? "Safari"
              : /iphone|ipad|ipod/i.test(ua) || /; wv\)/.test(ua)
                ? "In-app browser"
                : "Other";

  const os = /iphone|ipad|ipod/i.test(ua)
    ? "iOS"
    : /android/i.test(ua)
      ? "Android"
      : /windows/i.test(ua)
        ? "Windows"
        : /mac os x|macintosh/i.test(ua)
          ? "macOS"
          : /cros/i.test(ua)
            ? "ChromeOS"
            : /linux/i.test(ua)
              ? "Linux"
              : "Other";

  return { device, browser, os };
}

export const BOT_PATTERNS =
  /mediapartners|adsbot|dataprovider|inspectiontool|feedfetcher|preview|bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|baiduspider|yandex|duckduckbot|googlebot|bingbot|mj12bot|ahrefsbot|semrushbot|dotbot|rogerbot|screaming|headless|phantomjs|puppet|selenium|webdriver|python-requests|axios|node-fetch|go-http-client|java\/|curl|wget|scrapy|httpclient|applebot|petalbot|bytespider|gptbot|claudebot|anthropic|ccbot/i;

export function isBot(ua: string) {
  return !ua || ua.length < 20 || BOT_PATTERNS.test(ua);
}

// Accepts only short, plain identifiers/labels from the client.
export function cleanText(value: unknown, max = 120) {
  if (typeof value !== "string") return undefined;
  const v = value.trim().slice(0, max);
  return v || undefined;
}

export function cleanId(value: unknown) {
  return typeof value === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(value) ? value : undefined;
}
