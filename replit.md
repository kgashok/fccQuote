# Random Quote Generator

Generate, save, share, and print quotes from a choice of providers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

## Existing quote generator behavior to preserve

The original Express app and its tests are preserved in `.migration-backup/`.
It stores generated quotes in `.data/db.json` (ignored by Git). Choose DummyJSON
or ZenQuotes for random quotes, or FavQs or They Said So for their Quote of the
Day. ZenQuotes replaced Quotable with user approval; the old tag and length
controls are no longer supported. ZenQuotes batches are cached for one hour,
and its free API requires visible linked attribution, including on printable
ZenQuotes pages. They Said So requires the `THEYSAIDSO_API_KEY` environment
variable; DummyJSON, FavQs, and ZenQuotes do not require API keys. Quote
generation requires the selected service to be reachable when fetching a new
batch. Saved generation times represent the original generation event, not
page loads; do not invent timestamps for undated historical quotes.
