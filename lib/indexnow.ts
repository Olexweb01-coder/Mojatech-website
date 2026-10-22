/** Tells Bing and Yandex the moment pages change. A bonus: never blocks a save. */
export async function announce(paths: string[]) {
  const key = process.env.INDEXNOW_KEY;
  const host = "mojatechelectrical.com";
  if (!key || !paths.length || process.env.NODE_ENV !== "production") return;
  try {
    await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: paths.map((p) => `https://${host}${p}`) }),
      signal: AbortSignal.timeout(3000),
    });
  } catch { /* ignore */ }
}
