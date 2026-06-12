export default async function handler(_req, res) {
  try {
    const r = await fetch('https://explorer.dragonx.is/api/stats', {
      headers: { Accept: 'application/json' },
    });
    res.setHeader('Content-Type', 'application/json');
    res.status(r.ok ? 200 : 502);
    res.end(await r.text());
  } catch {
    res.status(502).json({ error: 'stats unavailable' });
  }
}
