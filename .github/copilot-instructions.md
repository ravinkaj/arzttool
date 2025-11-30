<!-- .github/copilot-instructions.md -->
# Copilot / AI Agent Instructions — arzttool

Purpose: give an AI coding agent just the essential, actionable information
needed to be productive in this small SvelteKit app.

1) Big picture
- This is a SvelteKit single-page application scaffolded from the Svelte starter.
- Routing is filesystem-based under `src/routes/` (SvelteKit). The project is
  intentionally minimal: entry pages are `src/routes/+page.svelte` and the
  global layout is `src/routes/+layout.svelte`.
- UI assets and small utilities live under the `$lib` alias (`src/lib/`).

2) Key files to read first
- `package.json` — contains dev scripts: `npm run dev`, `npm run build`,
  `npm run preview`.
- `svelte.config.js` — uses `@sveltejs/adapter-auto`; changing adapters
  affects deployment targets.
- `src/routes/+layout.svelte` — global layout; imports `favicon` from
  `$lib/assets/favicon.svg` and renders route children via `$props()`.
- `src/routes/+page.svelte` — the top-level content for `/` (simple example).
- `src/lib/` — place for reusable components, assets, helpers. Example:
  `src/lib/assets/favicon.svg` is imported in the layout.

3) Project-specific conventions & patterns
- Use the SvelteKit filesystem routing structure. To add a page, create
  `src/routes/<name>/+page.svelte` (client) or add `+page.server.js` / `+server.js`
  for server endpoints.
- Use the `$lib` alias to import shared code and assets: e.g.
  `import favicon from '$lib/assets/favicon.svg';`.
- The layout uses `let { children } = $props();` and `{@render children()}` to
  render route content — preserve this pattern when editing the layout.
- Keep changes minimal and local: this repo is a lightweight starter — avoid
  adding heavy dependencies unless required.

4) Build / dev / debug workflows
- Development server: `npm install` then `npm run dev` (Vite dev server).
- Build for production: `npm run build`.
- Preview a production build: `npm run preview`.
- If deploying to a non-auto environment, update `svelte.config.js` to a
  platform-specific adapter (e.g. `adapter-static`, `adapter-node`) and test
  `npm run build` locally before pushing.

5) Integration points & external dependencies
- Dependencies in `package.json` are dev/dev-only: Svelte 5, @sveltejs/kit,
  Vite. No backend services or external APIs are present in this repository.
- If a new server endpoint is required, follow SvelteKit server route files
  (`src/routes/<path>/+server.js`) and export standard request handlers.

6) Examples (copyable)
- Add a new route UI: create `src/routes/patients/+page.svelte` with
  a Svelte component to render `/patients`.
- Add a server endpoint: create `src/routes/api/patients/+server.js` and
  export `GET` / `POST` handlers to return JSON.

7) What NOT to change lightly
- `svelte.config.js` adapter setting — changing it affects how the app is
  built and deployed.
- The `type: "module"` field in `package.json` — imports use ESM syntax.

8) Missing / unknowns for the agent
- There are no tests, linters, or CI configurations in the repo to follow.
- No deployment target is recorded — ask the maintainer which platform
  (static site, node server, Vercel, Netlify, etc.) before changing adapters.

If anything above is unclear, or you need more specific patterns (naming
conventions for components, preferred CSS approach, or a target deployment),
ask the maintainer and I will update this file.
