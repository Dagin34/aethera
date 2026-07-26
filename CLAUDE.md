# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Aethera is a SvelteKit landing page/marketing site. It is an early-stage project (version 0.0.1) with a single route rendering a hero section.

## Commands

- `npm run dev` — start the Vite dev server (`-- --open` to open a browser tab)
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run check` — sync SvelteKit types and run `svelte-check` (TypeScript + Svelte type checking) against `tsconfig.json`
- `npm run check:watch` — same as above, in watch mode
- `npm run lint` — run ESLint over the whole project

There is no test suite or test runner configured in this project currently.

## Architecture

- **Framework**: SvelteKit 2 on Svelte 5, with runes mode force-enabled for all project files (but not `node_modules`) via `vite.config.ts`'s `compilerOptions.runes` callback.
- **Styling**: Tailwind CSS v4 via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js`; theme customization (colors, fonts) is done CSS-first with an `@theme` block in [src/routes/layout.css](src/routes/layout.css), imported once from [src/routes/+layout.svelte](src/routes/+layout.svelte). Custom fonts (Ibarra Real Nova, Homenaje) are pulled from Google Fonts in that same file.
- **Routing**: Minimal — currently just [src/routes/+page.svelte](src/routes/+page.svelte), which renders the [Hero](src/lib/components/hero.svelte) component. New shared UI should go under `src/lib/components/`, importable via the `$lib` alias.
- **Assets**: Images/video live in `src/lib/assets/` and are imported directly in components (e.g. `import productImg from '$lib/assets/landing-product.png'`) so SvelteKit/Vite can hash and bundle them, rather than referencing `static/` paths.
- **Svelte 5 idioms in use**: runes (`$props()`), and the `svelte/motion` `Spring` class for animated values (see `hero.svelte`'s mouse-parallax effect) — prefer these over legacy Svelte 4 stores/reactive-statement patterns when extending this code.
- **Adapter**: `@sveltejs/adapter-auto`, meaning no deployment target has been committed to yet — if a specific host is chosen, the adapter should be swapped accordingly.
