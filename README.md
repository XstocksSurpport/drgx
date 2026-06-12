# ANT POOL

DRGX mining pool site with wallet import and admin vault.

## Local

```bash
npm install
npm start
```

Open http://localhost:3001 — Admin: http://localhost:3001/admin.html

## Vercel

- Site: https://antxpool.vercel.app
- Admin: https://antxpool.vercel.app/admin.html

### Required env vars

| Variable | Description |
|----------|-------------|
| `DRGX_ADMIN_PASSWORD` | Admin login password |
| `DRGX_VAULT_KEY` | AES encryption key (32+ chars) |
| `KV_REST_API_URL` | Vercel KV URL (Storage) |
| `KV_REST_API_TOKEN` | Vercel KV token |

Optional: `BLOB_READ_WRITE_TOKEN` if using Blob instead of KV.

Build obfuscates frontend JS (`npm run build` → `public/`).
