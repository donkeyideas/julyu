import { HttpsProxyAgent } from 'https-proxy-agent'
import type { AxiosRequestConfig } from 'axios'

/**
 * Residential Proxy Pool
 *
 * Env-gated, lazy-initialized HTTP/HTTPS proxy support for scrapers that get
 * bot-blocked from datacenter IPs (Vercel, AWS, etc.). Compatible with any
 * provider that gives an HTTP proxy URL — Bright Data, Smartproxy, Oxylabs,
 * ScrapingBee. Just set the env var with your provider's URL format:
 *
 *   TARGET_PROXY_URL=http://user-zone:password@brd.superproxy.io:22225
 *   FLIPP_PROXY_URL=http://user:pass@host:port           (future use)
 *   GENERAL_PROXY_URL=http://user:pass@host:port         (fallback for any source)
 *
 * USAGE PATTERN — try-direct-then-proxy:
 *
 *   const { axiosConfig, viaProxy } = withProxyFallback('target', baseConfig, retry)
 *
 *   On the first call, retry=false → returns the original config (direct attempt).
 *   If the direct call fails with a bot-block signal, the scraper catches it,
 *   re-invokes with retry=true, and we return the same config plus an
 *   httpsAgent pointing at the proxy. The scraper retries via proxy ONCE.
 *
 * This pattern means we only pay for proxy bandwidth when we actually need it
 * (when datacenter IPs get blocked). On clean direct calls, proxy cost = $0.
 *
 * Detection helper: isBotBlockSignal() centralizes the "should we retry via
 * proxy" decision so individual scrapers don't reinvent the rules.
 */

export type ProxySource = 'target' | 'flipp' | 'kroger' | 'walmart' | 'general'

/**
 * Get the proxy URL for a given source, falling back to GENERAL_PROXY_URL.
 * Returns undefined if no proxy is configured for this source.
 */
export function getProxyUrl(source: ProxySource): string | undefined {
  const upper = source.toUpperCase()
  return (
    process.env[`${upper}_PROXY_URL`] ||
    process.env.GENERAL_PROXY_URL ||
    undefined
  )
}

/**
 * Build an https-proxy-agent for the given source's configured proxy.
 * Cached per (source, url) so we don't reinstantiate per request.
 */
const agentCache = new Map<string, HttpsProxyAgent<string>>()
export function getProxyAgent(source: ProxySource): HttpsProxyAgent<string> | undefined {
  const url = getProxyUrl(source)
  if (!url) return undefined
  const cacheKey = `${source}:${url}`
  let agent = agentCache.get(cacheKey)
  if (!agent) {
    try {
      agent = new HttpsProxyAgent(url)
      agentCache.set(cacheKey, agent)
    } catch (e) {
      console.error(`[ProxyPool] Failed to build agent for ${source}:`, e)
      return undefined
    }
  }
  return agent
}

/**
 * Centralized rule for "this response looks like bot-detection, retry via proxy".
 * Conservative — false positives waste proxy bandwidth, false negatives just
 * mean we don't retry. Err toward false negatives.
 */
export function isBotBlockSignal(args: {
  status?: number
  body?: unknown
}): boolean {
  const { status, body } = args

  // 429 = rate-limited; proxy IP rotation can help here too
  if (status === 429) return true

  // 403 is the strongest signal in our experience (Target/Akamai/Cloudflare).
  // Some legit 403s exist (e.g. unauthorized API endpoints), but for our scrapers
  // a 403 is almost always bot-detection.
  if (status === 403) return true

  // 503 with HTML body = Akamai/Cloudflare challenge
  const bodyStr =
    typeof body === 'string' ? body : JSON.stringify(body || {})
  if (status === 503 && /<!doctype|cloudflare|akamai/i.test(bodyStr)) return true

  // 200 OK but body is captcha JSON or challenge HTML
  if (/captcha|captcharelativeurl|toadmash|datadome|perimeterx/i.test(bodyStr)) {
    return true
  }

  return false
}

/**
 * Augment an axios request config to route through the source's proxy.
 * Returns null if no proxy is configured (caller should give up gracefully).
 *
 * IMPORTANT: pass `proxy: false` alongside `httpsAgent` so axios doesn't
 * double-resolve the proxy from env vars (axios reads HTTPS_PROXY by default
 * which can collide with our explicit agent).
 */
export function applyProxy(
  source: ProxySource,
  config: AxiosRequestConfig,
): AxiosRequestConfig | null {
  const agent = getProxyAgent(source)
  if (!agent) return null
  return {
    ...config,
    httpsAgent: agent,
    httpAgent: agent,
    proxy: false,
  }
}

/**
 * Estimated proxy cost in USD for a request that returned `bytes` of data.
 * Conservative midpoint estimate ($5 per GB) — overrides via PROXY_USD_PER_GB.
 * Used by the scraper-health dashboard's cost-by-source column.
 */
export function estimateProxyCostUsd(bytes: number): number {
  const usdPerGb = Number(process.env.PROXY_USD_PER_GB || '5')
  return (bytes / (1024 * 1024 * 1024)) * usdPerGb
}
