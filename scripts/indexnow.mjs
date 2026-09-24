/* Tells Bing, Yandex and other IndexNow engines that pages have changed.
   Run after a deploy:  node scripts/indexnow.mjs            */
const KEY = "ec41a28b82af092dc19a2e1464742fd1";
const HOST = "mojatechelectrical.com";
const PAGES = ["/", "/about", "/services", "/work", "/careers", "/contact",
  "/services/electrical-installation", "/services/solar-inverter", "/services/cctv-security",
  "/services/industrial", "/services/maintenance", "/services/power-audit", "/services/automation"];

const body = {
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: PAGES.map((p) => `https://${HOST}${p}`),
};

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});
console.log(`IndexNow replied ${res.status} ${res.statusText} for ${PAGES.length} pages`);
console.log(res.status === 200 || res.status === 202 ? "Accepted. Bing and Yandex will crawl shortly." : await res.text());
