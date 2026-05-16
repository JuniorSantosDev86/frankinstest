# Research: Workspace Navigation Fix

## Decision: Centralize Workspace hash-to-section mapping

**Rationale**: The bug exists because link navigation updates the hash but the rendered Workspace detail domain is controlled separately. A canonical mapping makes each hash resolve to one active domain and avoids duplicated assumptions between sidebar, overview cards, tabs, and tests.

**Alternatives considered**:

- Keep each link as a plain anchor only: rejected because it preserves the current URL-only failure mode.
- Add ad hoc click handlers per sidebar item: rejected because it is fragile and likely to drift as Workspace sections change.
- Route every section through separate application pages: rejected as a broad navigation redesign outside 09D.

## Decision: Activate the Workspace detail domain as the primary visible change

**Rationale**: The user-reported issue is that the main page appears stuck on the overview. Switching the active detail domain provides a clear visible response and aligns with the existing `WorkspaceDetailArea` domain tabs.

**Alternatives considered**:

- Scroll only to anchors in a long page: acceptable as supporting behavior, but insufficient if the wrong domain is not rendered.
- Hide the overview permanently after navigation: rejected because it is a broader IA/layout change.
- Replace the dashboard with a full router-driven workspace: rejected as too broad for the bug fix.

## Decision: Keep hash, active domain, active sidebar item, and focus synchronized

**Rationale**: Users need URL state for reload/share and active UI state for orientation. Tests should validate the full contract: selected link, hash, and visible/focused content represent the same target.

**Alternatives considered**:

- Store only local state and ignore hash: rejected because hash reload/direct-entry is an explicit acceptance criterion.
- Use hash only and derive active UI opportunistically: rejected because it caused the current mismatch.

## Decision: Recover invalid hashes to the existing default Workspace entry

**Rationale**: Invalid or obsolete hashes should not leave the app in a misleading active state. Falling back to the existing default preserves current behavior for users without hash URLs.

**Alternatives considered**:

- Show an error state for invalid hash: rejected as unnecessary friction for an internal navigation target.
- Preserve invalid hash with no active item: rejected because it violates active-state consistency.

## Decision: Preserve disabled future items as disabled

**Rationale**: "Assistencia de design de testes" is currently marked "Em breve" and disabled. The navigation fix should not make future or placeholder surfaces appear implemented.

**Alternatives considered**:

- Make disabled items navigate to a placeholder: rejected because it could imply a new AI feature, which is out of scope.
- Remove disabled items: rejected because it changes the visual IA more than needed.

## Decision: Use existing frontend validation commands

**Rationale**: The project already validates frontend changes with lint, Node tests, and production build. The feature should add focused navigation coverage while preserving existing tests.

**Alternatives considered**:

- Add a new E2E framework now: rejected as dependency and setup expansion outside this narrow fix.
- Rely on manual testing only: rejected because the bug is a regression-prone navigation contract.
