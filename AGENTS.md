## Core Principles

- **Priority:** Performance, security, simplicity, and readability are the number 1 priorities for this project. Always prioritize straightforward, readable code over clever abstractions, and ensure all implementations are secure and performant by default.

## Code Style

- **Environment Variables:** Read env vars through `privateEnv` from `src/lib/server/env.ts`. This ensures runtime validation for dynamic private variables.
- **Functions:** Keep things in one function unless composable or reusable.
- **Error Handling:** PREFER THROWING ERRORS TO FAIL FAST. In SvelteKit load functions and server actions, always use `throw error(status, message)` from `@sveltejs/kit` rather than throwing raw JS Error objects.
- **TypeScript:** 
  - Avoid using the `any` type.
  - Rely on type inference when possible; avoid explicit type annotations or interfaces unless necessary for exports or clarity.
  - Prefer functional array methods (`flatMap`, `filter`, `map`) over `for` loops; use type guards on `filter` to maintain type inference downstream.
  - Avoid unnecessary destructuring in TypeScript logic; use dot notation to preserve context. **(Exception: Destructuring Svelte component `$props()` is allowed and expected).**
  - Prefer early returns over nested `else` statements.

## Naming Conventions

- Use descriptive `camelCase` for variables, parameters, and functions (e.g., `config`, `processId`, `options`).
- Use `PascalCase` for Svelte components, Types, and Interfaces.
- Avoid overly generic or highly abbreviated names unless the context is exceedingly narrow (e.g., inside a short map function).

## Data & Backend (Drizzle ORM)

- All database queries and schema definitions must use Drizzle ORM and reside within `src/lib/server/db` or within `.server.ts` files.
- Never leak database connection logic or sensitive server code to the client.

## Hard-Cut Product Policy

- This application currently has no external installed user base; optimize for one canonical current-state implementation, not compatibility with historical local states.
- Do not preserve or introduce compatibility bridges, migration shims, fallback paths, compact adapters, or dual behavior for old local states unless the user explicitly asks for that support.
- Prefer:
  - one canonical current-state codepath
  - fail-fast diagnostics
  - explicit recovery steps
over:
  - automatic migration
  - compatibility glue
  - silent fallbacks
  - "temporary" second paths
- If temporary migration or compatibility code is introduced for debugging or a narrowly scoped transition, it must be called out in the same diff with:
  - why it exists
  - why the canonical path is insufficient
  - exact deletion criteria
  - the ADR/task that tracks its removal
- Default stance across the app: delete old-state compatibility code rather than carrying it forward.

## shadcn-svelte

- Before building a new UI component, check https://www.shadcn-svelte.com/docs/components first. If the component exists, use it instead of building from scratch.
- When styling components in `src/lib/components/ui/**`, add supported options to the component API using `tailwind-variants` (`tv`), such as adding a new variant: `'rose'` definition.
- Do not rely on app-level CSS classes like `rose-cta` for shadcn component styling when the style belongs in the component.
- Barrel exports live in `src/lib/components/ui/<name>/index.ts`.

## Tailwind CSS

- Prefer canonical Tailwind utilities and scale tokens over arbitrary values when an exact equivalent exists.
- Prefer existing shared utilities before adding new class bundles.
- Check `src/routes/layout.css` for shared `@utility` blocks (like `shell` or `frame`). If the same UI pattern appears in multiple places, prefer a shared utility there.
- Only create a shared utility when the abstraction is clear and the CSS would otherwise be duplicated.
- Do not edit `src/lib/components/ui/**` only to satisfy Tailwind canonicalization or style cleanup unless the task requires changing shadcn internals.
