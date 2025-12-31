const IMAGE_PROXY_BASE = "https://images.weserv.nl/";
const OPTIMIZED_IMAGE_HOSTS = new Set(["cdn.diabolical.services"]);

const getHostFromUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  try {
    return new URL(url, "https://example.com").hostname;
  } catch {
    return "";
  }
};

const isOptimizableUrl = (url) => {
  const host = getHostFromUrl(url);
  if (!host) return false;
  return OPTIMIZED_IMAGE_HOSTS.has(host);
};

export const getOptimizedImageUrl = (url, options = {}) => {
  if (!isOptimizableUrl(url)) return url;

  const params = new URLSearchParams();
  params.set("url", url);

  if (options.width) params.set("w", String(Math.round(options.width)));
  if (options.height) params.set("h", String(Math.round(options.height)));
  if (options.fit) params.set("fit", options.fit);
  if (options.quality) params.set("q", String(Math.round(options.quality)));
  if (options.format) params.set("output", options.format);

  return `${IMAGE_PROXY_BASE}?${params.toString()}`;
};

export const buildOptimizedSrcSet = (url, widths, options = {}) => {
  if (!isOptimizableUrl(url)) return undefined;
  return widths
    .map((width) => `${getOptimizedImageUrl(url, { ...options, width })} ${width}w`)
    .join(", ");
};

export const getOptimizedThumbnailUrl = (url, size = 120) => {
  return getOptimizedImageUrl(url, {
    width: size,
    height: size,
    fit: "cover",
    format: "webp",
    quality: 70,
  });
};
