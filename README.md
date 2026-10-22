# A World in Progress

A private, compact Next.js 16 / React 19 / TypeScript / Three.js portfolio for Sreerag Pariyarath. All 3D geometry and animation are procedural; no paid models or remote 3D assets are required.

## Run

Use the package manager declared in package.json. `pnpm dev` serves port 4173. `pnpm build` produces a static Next.js export in `out/`. Sites owns the private hosting policy; no client-side password or robots tag is used as access control.

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
