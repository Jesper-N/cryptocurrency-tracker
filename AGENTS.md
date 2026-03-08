## shadcn-svelte

- Before building a new UI component, check https://www.shadcn-svelte.com/docs/components first.
- If the component exists, use it instead of building from scratch.
- When styling components in `src/lib/components/ui/**`, add supported options to the component API when appropriate, such as `variant="rose"`.
- Do not rely on app-level CSS classes like `rose-cta` for shadcn component styling when the style belongs in the component.
- Barrel exports live in `src/lib/components/ui/<name>/index.ts`.

## Code Style

- Read env vars through `privateEnv` from `src/lib/server/env.ts`.
- Keep things in one function unless composable or reusable.
- Avoid `try`/`catch` where possible; PREFER THROWING ERRORS TO FAIL FAST.
- Avoid using the `any` type.
- Rely on type inference when possible; avoid explicit type annotations or interfaces unless necessary for exports or clarity.
- Prefer functional array methods (`flatMap`, `filter`, `map`) over `for` loops; use type guards on `filter` to maintain type inference downstream.
- Avoid unnecessary destructuring. Use dot notation to preserve context.
- Avoid `else` statements. Prefer early returns.

## Agent Workflow

- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.
- Prefer automation: execute requested actions without confirmation unless blocked by missing info or safety/irreversibility.

## Naming

- Prefer single word names for variables and functions. Only use multiple words if necessary.

### Naming Enforcement (Read This)

THIS RULE IS MANDATORY FOR AGENT WRITTEN CODE. ZERO EXCEPTIONS.

- Use single word names by default for new locals, params, and helper functions.
- Multi-word names are allowed only when a single word would be unclear or ambiguous.
- Do not introduce new camelCase compounds when a short single-word alternative is clear.
- Before finishing edits, review touched lines and shorten newly introduced identifiers where possible.
- Good short names to prefer: `pid`, `cfg`, `err`, `opts`, `dir`, `root`, `child`, `state`, `timeout`.
- Examples to avoid unless truly required: `inputPID`, `existingClient`, `connectTimeout`, `workerPath`.

```ts
// Good
const foo = 1;
function journal(dir: string) {}

// Bad
const fooBar = 1;
function prepareJournal(dir: string) {}
```

Reduce total variable count by inlining when a value is only used once.

```ts
// Good
const journal = await read(path.join(dir, 'journal.json'));

// Bad
const journalPath = path.join(dir, 'journal.json');
const journal = await read(journalPath);
```

## Tailwind

- Prefer existing shared utilities before adding new class bundles.
- Check `src/routes/layout.css` for shared CTA, label, separator, and surface utilities.
- If the same UI pattern appears in multiple places, prefer a shared utility in `src/routes/layout.css`.
- Only create a shared utility when the abstraction is clear and the CSS would otherwise be duplicated.
- Do not edit `src/lib/components/ui/**` only to satisfy Tailwind canonicalization or style cleanup unless the task requires changing shadcn internals.
- Prefer canonical Tailwind utilities and scale tokens over arbitrary values when an exact equivalent exists.

## Fail-Fast & No Silent Fallbacks (HARD CUTOUT APPROACH)

CONTEXT: THIS IS A GREENFIELD PROJECT. ZERO EXISTING USERS. OPTIMIZE ENTIRELY FOR FASTEST CRASH ELIMINATION, NOT CAUTIOUS ROLLOUT. ERRORS MUST BE LOUD, FATAL, AND EXPLICIT. NO EXCUSES.

### Core Directives

1. HARD CUTOUT APPROACH, NO FALLBACKS. WHEN SOMETHING FAILS, THE SYSTEM MUST STOP AND ALERT IMMEDIATELY. DO NOT SILENTLY CONTINUE WITH DEGRADED DATA.
2. NO SILENT DEFAULTS. DO NOT RETURN SUCCESS-SHAPED FALLBACKS, EMPTY UI STATES, OR DEFAULT OBJECTS ON FAILURE.
3. NO CAUTIOUS ROLLOUTS. DO NOT DESIGN FOR "BACKWARDS COMPATIBILITY", "GRACEFUL DEGRADATION", "DEPRECATION", "GATING", OR "DEFAULT OFF" STATES.
4. AUDIT TAGGING. IF A FRAMEWORK OR TYPE-CHECKER STRICTLY FORCES A DEFAULT/FALLBACK PATH THAT WILL BREAK THE BUILD IF REMOVED, YOU MUST PREPEND THE EXACT COMMENT // FALLBACK IMMEDIATELY PRECEDING THE LINE.

### Anti-Patterns to AVOID (ZERO TOLERANCE)

```ts
// ❌ BAD: Silent fallback to empty/default (masks data pipeline bugs)
const apiKey = process.env.API_KEY ?? '';
const batchPath = extractPath(msg) ?? getTodayPath();
const cost = data.cost ?? 0;
const avatar = user.avatar ?? defaultAvatar; // Let the UI break so we fix the data

// ❌ BAD: Fire-and-forget errors (swallows crashes)
sendAlert(error).catch(() => {});
poll().catch(() => {});

// ❌ BAD: Swallowing errors and continuing
try {
	const data = await fetchData();
} catch {
	return null; // Caller has no idea this failed
}

// ❌ BAD: Dev defaults that could leak to prod
const secret = process.env.SECRET || 'dev-secret-change-me';
```

### What To Do Instead (Fail Fast & Loud)

```ts
// ✅ GOOD: Fail immediately if required value missing
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('API_KEY environment variable is required');
// ✅ GOOD: Validate and reject, don't fallback

const batchPath = extractPath(msg);
if (!batchPath) throw new Error('Message missing required metadata: batchPath');
// ✅ GOOD: Explicit error bubbling (No silent catches)

try {
	await sendAlert(error);
} catch (alertError) {
	console.error('FATAL: Failed to send alert:', alertError);
	throw alertError; // Always re-throw unless at the absolute top boundary
}
// ✅ GOOD: Using the Audit Tag ONLY when strictly required by a framework

// FALLBACK
const frameworkRequiredState = externalProp ?? { default: true };
```

## Code Editing Discipline

- DO NOT RUN SCRIPTS THAT BULK-MODIFY CODE (CODEMODS, INVENTED ONE-OFF SCRIPTS, GIANT SED/REGEX REFACTORS).
- LARGE MECHANICAL CHANGES: BREAK INTO SMALLER, EXPLICIT EDITS AND REVIEW DIFFS.
- SUBTLE/COMPLEX CHANGES: EDIT BY HAND, FILE-BY-FILE, WITH CAREFUL REASONING.
- OPTIMIZE FOR A CLEAN ARCHITECTURE NOW, NOT BACKWARDS COMPATIBILITY.
- NO "COMPAT SHIMS" OR "V2" FILE CLONES — WHEN CHANGING BEHAVIOR, MIGRATE CALLERS AND COMPLETELY DELETE OLD CODE.
- NEW FILES ARE ONLY FOR GENUINELY NEW DOMAINS THAT DON'T FIT EXISTING MODULES.
- THE BAR FOR ADDING FILES IS HIGH.
