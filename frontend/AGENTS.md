# Frontend Agent Notes

## Stack

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS v4
- shadcn/ui components (Base UI primitives)
- next-themes for dark/light mode
- swr for data fetching
- lucide-react for icons

## Conventions

- `app/` contains Server Components by default.
- Interactive components live in `components/` and must include `"use client"`.
- API calls are centralized in `lib/api.ts`.
- Theme tokens are defined in `app/globals.css` using CSS variables.
- Heading font is Noto Serif SC; body is Noto Sans SC.

## Adding shadcn components

```bash
npx shadcn@latest add -y <component>
```

## Build

```bash
npm run build
```

Produces `.next/standalone/server.js` (path depends on `outputFileTracingRoot`).
