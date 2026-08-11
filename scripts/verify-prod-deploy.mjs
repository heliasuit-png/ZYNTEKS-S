const origin = "https://zynteksisv.vercel.app";

async function check(path) {
  const res = await fetch(`${origin}${path}`, {
    headers: { "cache-control": "no-cache", pragma: "no-cache" },
  });
  const text = await res.text();
  return {
    path,
    status: res.status,
    age: res.headers.get("age"),
    cache: res.headers.get("x-vercel-cache"),
    localhost: (text.match(/http:\/\/localhost:3000/g) || []).length,
    prod: (text.match(/https:\/\/zynteksisv\.vercel\.app/g) || []).length,
    sitemapLine:
      text
        .split(/\r?\n/)
        .find((line) => line.startsWith("Sitemap:")) ?? null,
    firstLoc: text.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? null,
    bodySnippet: text.slice(0, 220).replace(/\s+/g, " "),
  };
}

const robots = await check("/robots.txt");
const sitemap = await check("/sitemap.xml");
const home = await check("/");

console.log(
  JSON.stringify(
    {
      deploymentExpectation: "dpl_UNzXFFt4DrQzmG4J8YWhTpj1pQko",
      robots,
      sitemap,
      home: {
        status: home.status,
        age: home.age,
        cache: home.cache,
        localhost: home.localhost,
        prod: home.prod,
      },
      ok: {
        robotsSitemap:
          robots.sitemapLine ===
          "Sitemap: https://zynteksisv.vercel.app/sitemap.xml",
        sitemapNoLocalhost: sitemap.localhost === 0 && sitemap.prod > 0,
        homeNoLocalhost: home.localhost === 0,
        freshHome: Number(home.age ?? 0) < 3600,
      },
    },
    null,
    2,
  ),
);
