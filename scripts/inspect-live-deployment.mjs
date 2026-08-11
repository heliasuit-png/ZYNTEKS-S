/**
 * Read-only probe of the live Vercel Production deployment identity.
 * Does not modify application code or call authenticated APIs.
 */

const ORIGIN = "https://zynteksisv.vercel.app";

async function head(path) {
  const res = await fetch(`${ORIGIN}${path}`, {
    method: "GET",
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });
  const headers = {};
  for (const [k, v] of res.headers.entries()) {
    if (
      /^(x-|age$|etag$|date$|cache-control$|server$)/i.test(k)
    ) {
      headers[k] = v;
    }
  }
  const body = await res.text();
  return { status: res.status, headers, body };
}

function extractBuildId(html) {
  const fromScript = html.match(/\/_next\/static\/([A-Za-z0-9_-]+)\/_buildManifest\.js/);
  if (fromScript) return fromScript[1];
  const fromChunk = html.match(/\/_next\/static\/([A-Za-z0-9_-]+)\//g);
  if (!fromChunk) return null;
  const ids = [
    ...new Set(
      fromChunk
        .map((s) => s.replace(/^\/_next\/static\//, "").replace(/\/$/, ""))
        .filter((id) => id !== "chunks" && id !== "css" && id !== "media"),
    ),
  ];
  return ids[0] ?? null;
}

const home = await head("/");
const robots = await head("/robots.txt");
const sitemap = await head("/sitemap.xml");

const buildId = extractBuildId(home.body);
const localhostHome = [...home.body.matchAll(/http:\/\/localhost:3000/g)].length;
const prodHome = [...home.body.matchAll(/https:\/\/zynteksisv\.vercel\.app/g)].length;

const sitemapLocal =
  [...sitemap.body.matchAll(/http:\/\/localhost:3000/g)].length > 0;
const robotsLocal = robots.body.includes("http://localhost:3000/sitemap.xml");

const ageHome = Number(home.headers.age ?? "0");
const estimatedOriginMs = Date.now() - ageHome * 1000;

console.log(
  JSON.stringify(
    {
      probedAt: new Date().toISOString(),
      nextBuildId: buildId,
      homepage: {
        cache: home.headers["x-vercel-cache"],
        ageSeconds: home.headers.age,
        nextjsPrerender: home.headers["x-nextjs-prerender"],
        vercelId: home.headers["x-vercel-id"],
        localhostHits: localhostHome,
        productionUrlHits: prodHome,
        estimatedCachedSince: new Date(estimatedOriginMs).toISOString(),
      },
      robots: {
        cache: robots.headers["x-vercel-cache"],
        ageSeconds: robots.headers.age,
        sitemapLine: robots.body
          .split(/\r?\n/)
          .find((l) => l.startsWith("Sitemap:")),
        usesLocalhost: robotsLocal,
      },
      sitemap: {
        cache: sitemap.headers["x-vercel-cache"],
        ageSeconds: sitemap.headers.age,
        usesLocalhost: sitemapLocal,
        firstLoc: sitemap.body.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? null,
      },
      inference: {
        turborepoInRepo: false,
        staticRoutesBakeEnvAtBuild: true,
        activeArtifactHasLocalhostAppUrl: robotsLocal || sitemapLocal,
      },
    },
    null,
    2,
  ),
);
