# UI Contract: Workspace Navigation

This is a frontend interaction contract, not a backend API contract.

## Scope

Applies to enabled Workspace sidebar items, Workspace overview CTAs, detail-domain tabs, browser hash state, and direct/reload entry with hash URLs. Disabled, future, or out-of-scope items are visible navigation affordances but not required navigation targets.

## Enabled Navigation Targets

Each enabled target must satisfy this contract:

- The target has one canonical hash.
- The target maps to one active Workspace detail domain.
- The target may map to one inner section inside that domain.
- Clicking the target updates the browser hash.
- Clicking the target makes the mapped domain visible as the active Workspace detail area as the primary navigation effect.
- If an inner section exists, the page clearly focuses or scrolls to that section after the domain is available as a secondary visibility/accessibility aid.
- The active sidebar item represents the same target as the current hash and displayed/focused content.
- The target section has a stable target identifier suitable for focus/scroll behavior.

## Disabled Navigation Targets

Disabled targets must satisfy this contract:

- They remain visually disabled or marked as future/unavailable.
- They do not become active on click.
- They do not update the URL/hash as if they were active targets.
- They do not imply that an out-of-scope product surface was implemented.
- They do not trigger AI, backend, billing, auth, credit, or audit behavior.

## Hash Entry Contract

On page load or reload:

- Missing hash opens the existing default Workspace state.
- Valid hash activates the mapped domain and optional section.
- Invalid hash recovers to the existing default Workspace state.
- The sidebar active state never points at a different section than the displayed/focused content.

## Expected Target Coverage

The implementation must cover 100% of currently visible enabled sidebar targets:

- Control Tower
- Projetos
- Modulos
- Requisitos
- Regras de negocio
- Cenarios de teste
- Casos de teste
- Suites de teste
- Ciclos de teste
- Execucao de testes
- Bugs e defeitos
- Evidencias
- Relatorios
- IA e creditos
Configuracoes behavior is fixed for this block:

- If Configuracoes is visible and enabled, it must map to a valid Workspace section and be included in enabled-target coverage.
- If no settings section exists in this block, Configuracoes must be marked disabled/future/out-of-scope and excluded from enabled-target coverage.
- When disabled/future/out-of-scope, Configuracoes must not update URL/hash as an active target.

The "Assistencia de design de testes" item remains disabled/future unless an existing implemented section already supports it without new AI feature work.

## Test Contract

Frontend tests should verify:

- Every enabled sidebar item hash appears in the canonical navigation mapping.
- Behavior-level validation proves that selecting an enabled sidebar item changes the active/visible Workspace detail area, not only source strings or mappings.
- Hash-to-domain mapping includes product, QA design, execution, quality, reports, and AI/credits domains.
- Active sidebar styling/state is derived from current active navigation state, not hard-coded only to Control Tower.
- Direct valid hash initialization activates the expected domain.
- Invalid hash initialization falls back without a misleading active sidebar item.
- Disabled targets do not participate in enabled navigation assertions.
- Focus/scroll behavior is supplementary and does not satisfy navigation without active detail-domain display.
