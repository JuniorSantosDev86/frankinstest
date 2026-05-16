# Quickstart: Workspace Navigation Fix

## Preconditions

- Work from repository root.
- Use branch `003-workspace-navigation-fix`.
- Do not make backend, AI, auth, billing, i18n expansion, or broad UI redesign changes.
- Do not commit from the agent.

## Implementation Focus

1. Inspect `apps/web/src/app/components/WorkspaceDashboard.tsx`.
2. Inspect `apps/web/src/app/page.tsx`.
3. Define or reuse one canonical mapping from enabled Workspace hashes to active detail domains and optional inner sections.
4. Wire sidebar and overview links so click, active state, hash update, and displayed/focused section stay synchronized.
5. Support initial load/reload from valid hash.
6. Recover invalid or missing hashes to the existing default Workspace state.
7. Preserve PT-BR labels and current visual design.
8. Keep disabled/future items disabled and exclude them from enabled-target navigation counts.
9. Treat Configuracoes as enabled only if it maps to an existing valid section; otherwise keep it disabled/future/out-of-scope and prevent active hash updates.

## Validation

From `apps/web`:

```bash
npm run lint
npm test
npm run build
```

## Manual QA Checklist

- Open the Workspace without a hash; the default view is valid and visually unchanged.
- Click each enabled sidebar item; the main Workspace detail/domain area visibly changes to the expected section.
- Confirm focus/scroll improves visibility when needed but is not the only navigation effect.
- Confirm the active sidebar item matches the visible/focused section.
- Confirm the URL hash matches the active section.
- Reload a URL with each valid hash and confirm the same section is active.
- Try an invalid hash and confirm the app recovers to a valid default state.
- Confirm "Assistencia de design de testes" remains disabled/future unless an already implemented section supports it.
- Confirm "Configuracoes" maps to a valid section if enabled, or remains disabled/future/out-of-scope without updating hash as active if no settings section exists.
- Confirm forms and lists for existing Workspace artifacts still work.

## Run Report Expectations

The implementation run report must include:

1. Files changed or created.
2. Functionality implemented.
3. Business rules preserved.
4. Tests added or updated.
5. Validation commands executed.
6. Known limitations.
7. Roadmap/current-status updates.
8. Suggested commit message.
