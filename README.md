NestJS API
From the project root:
pnpm --filter api start:dev

This runs the NestJS server in watch mode.
Or:
cd apps/api
pnpm start:dev

Next.js Web
From the project root:
pnpm --filter web dev

Or:
cd apps/web
pnpm dev

Recommended setup — two terminals
Terminal 1 — NestJS API:
cd C:\Users\HaiderAli\resume-forge
pnpm --filter api start:dev

Terminal 2 — Next.js:
cd C:\Users\HaiderAli\resume-forge
pnpm --filter web dev

Your API health endpoint is:
http://localhost:3000/api/v1/health/live