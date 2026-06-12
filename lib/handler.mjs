import { route } from '../lib/router.mjs';

export async function handleApi(req, res, path) {
  try {
    const url = req.url || '';
    const qs = url.includes('?') ? url.slice(url.indexOf('?')) : '';
    const out = await route({
      method: req.method,
      url: path + qs,
      headers: req.headers,
      body: req.body,
    });
    res.status(out.status);
    for (const [k, v] of Object.entries(out.headers || {})) {
      res.setHeader(k, v);
    }
    res.end(out.body);
  } catch (err) {
    res.status(500).json({ error: err.message || 'internal error' });
  }
}
