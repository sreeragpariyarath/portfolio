# A World in Progress

A compact Next.js 16 / React 19 / TypeScript / Three.js portfolio for Sreerag Pariyarath. All 3D geometry and animation are procedural; no paid models or remote 3D assets are required.

## Run

Use the package manager declared in package.json. `pnpm dev` serves port 4173. `pnpm build` produces a static Next.js export in `out/`. The site is public and has no access control.

## Play

- WASD or arrow keys: walk
- Shift: run
- E: inspect a nearby project
- J: project journal; M: map; ?: controls
- R: return to spawn; Esc: close a panel
- Map and undiscovered stamps can guide the character along a road. A movement key cancels the route.

Four landmarks represent LearnWithHupe, Warox, Erris, and YEXORA. Entering the interaction radius reveals a project and records discovery in localStorage. The journal remains accessible without completing the walk. Native modal dialogs pause movement and contain focus. Touch controls and reduced-motion preferences are supported.

## Implementation

`app/world.ts` owns the Three.js scene, follow camera, procedural Graphite Reaper-style character, pivot walk cycle, renderer lifecycle, collision stepping, and guided routes. WebGL is preferred; Three.js SVGRenderer provides a vector version when WebGL is unavailable. Pencil textures are generated locally. `app/movement.ts` contains pure collision and proximity logic. `app/projects.ts` contains the editable case notes and links. `app/portfolio.tsx` owns the accessible interface and journal.

## Validation

Run `pnpm test:movement` for normalization, run speed, collision sliding, boundaries, and proximity. `pnpm build` includes TypeScript validation. Browser QA uses the managed preview. This environment disables WebGL; the SVG fallback exercises the same scene, camera, movement, and project interactions. GPU-specific appearance and performance require a device with WebGL.

Prototype scope: one small city; keyboard movement; four project stops; journal, map, maker note, and contact links. No combat, physics engine, external model rig, or content backend.

## CI/CD

GitHub Actions in `.github/workflows/`:

- `ci.yml` runs on pull requests: typecheck, lint, movement tests, a production build (static export to `out/`, with a client JavaScript budget), and Playwright smoke tests for desktop and mobile against that export, served through the Cloudflare Pages runtime so `public/_headers` applies. The `CI gate` job is the one status check to require in branch protection.
- `security.yml` runs `pnpm audit --prod` (blocks on high), CodeQL, and dependency review on pull requests, plus a weekly schedule.
- `deploy.yml` runs on `main` and manual dispatch: it re-runs CI, publishes the tested `out/` to the Cloudflare Pages project `sreerag` with `wrangler pages deploy`, then smoke-tests the deployment and production URLs.

Deploying needs the `CLOUDFLARE_API_TOKEN` (Cloudflare Pages: Edit only) and `CLOUDFLARE_ACCOUNT_ID` secrets in a `production` GitHub environment. Set the `SITE_URL` repository variable once a custom domain is live. To run the browser tests locally, build first (`pnpm build`), then `pnpm test:e2e`.
