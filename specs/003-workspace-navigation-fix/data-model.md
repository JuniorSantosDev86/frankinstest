# Data Model: Workspace Navigation Fix

This feature introduces no persisted product data, database tables, backend DTOs, or QA artifact records. The model below describes frontend navigation state only.

## Workspace Navigation Target

Represents a navigable sidebar or overview link target.

**Fields**:

- `hash`: Unique hash string visible in the browser URL, including the leading `#`.
- `label`: Existing PT-BR user-facing label shown in the Workspace navigation.
- `group`: Existing sidebar group or overview context.
- `domainId`: Workspace detail domain to activate, such as product, QA design, execution, quality, reports, or AI/credits.
- `sectionId`: Optional inner section to focus after the domain is active.
- `disabled`: Whether the target is visible but intentionally not navigable.

**Validation rules**:

- Every enabled sidebar item must map to exactly one navigation target.
- Every enabled target must resolve to an existing domain or focusable section.
- Disabled targets must not become active through click handling.
- Labels remain PT-BR and preserve existing wording unless a tiny correction is needed.

## Active Workspace Navigation State

Represents the current selected/focused Workspace area.

**Fields**:

- `activeHash`: Current canonical hash for the selected target.
- `activeDomainId`: Current Workspace detail domain shown as active.
- `activeSectionId`: Optional inner section to focus when present.
- `fallbackUsed`: Whether the state came from recovery after missing/invalid hash.

**State transitions**:

- **Initial load without hash** -> existing default Workspace state.
- **Initial load with valid hash** -> matching active target.
- **Initial load with invalid hash** -> existing default Workspace state with no misleading active sidebar item.
- **Sidebar click on enabled target** -> target hash, active domain, active sidebar item, and focus target update together.
- **Sidebar click on disabled target** -> no active state change.
- **Hash change after page load** -> matching active target when valid, fallback when invalid.

## Workspace Detail Domain

Represents a displayed domain inside `WorkspaceDetailArea`.

**Fields**:

- `id`: Domain identifier used by existing detail tabs.
- `label`: PT-BR display label.
- `description`: PT-BR description already used by the active tab header.
- `sectionIds`: Inner sections rendered while the domain is active.

**Relationships**:

- One domain can have many navigation targets.
- One navigation target resolves to one domain.
- A navigation target may optionally identify one inner section inside that domain.

## Non-entities

- Projects, modules, requirements, rules, scenarios, cases, suites, cycles, executions, bugs, evidence, reports, AI runs, and credits are not changed by this feature.
- No backend entity, API contract, migration, audit event, or persisted setting is introduced.
