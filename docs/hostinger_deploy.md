# Hostinger Deployment Guide (Next.js Standalone)

This project is prepared for Hostinger with standalone output.

## Prerequisites

- Hostinger plan with Node.js app support (or VPS)
- Supabase project ready
- Environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Build

Run locally:

```bash
npm install
npm run build
```

## Files to Upload

Upload/copy these artifacts to your Hostinger app directory:

1. `.next/standalone`
2. `.next/static` -> copy into `.next/standalone/.next/static`
3. `public` -> copy into `.next/standalone/public`

Final structure should include:

```text
.next/standalone/server.js
.next/standalone/.next/static/...
.next/standalone/public/...
```

## Start Command

Use one of:

```bash
node .next/standalone/server.js
```

or

```bash
npm run start:standalone
```

## Notes

- Keep `NODE_ENV=production`.
- If Hostinger assigns a port, set `PORT` accordingly.
- Apply Supabase SQL migrations `001` through `009` before first production run.
