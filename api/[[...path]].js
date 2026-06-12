import { route } from '../lib/router.mjs';

export default async function handler(req, res) {
  const out = await route(req);
  res.status(out.status);
  for (const [k, v] of Object.entries(out.headers || {})) {
    res.setHeader(k, v);
  }
  res.end(out.body);
}

export const config = { api: { bodyParser: true } };
