---
name: eventhub-product
description: Use when implementing, reviewing, or documenting EventHub marketplace features, customer event planning, provider workflows, admin tools, or changes to their data flows and requirements.
---

# EventHub Feature Implementation Skill

Use this workflow for EventHub product changes.

## Required context

1. Read `docs/eventhub-product-spec.md`.
2. Read the directly related frontend component/page and trace calls through `frontend/src/api/client.ts`.
3. For API or persistence changes, inspect the relevant route, authorization checks, and SQLAlchemy models in `backend/app/main.py`.
4. Identify requirement IDs and acceptance scenarios affected by the task.

## Implementation steps

1. Confirm the user role and workflow boundaries involved.
2. Trace data from user action through UI, API request, authorization/validation, persistence, response, and visible feedback.
3. Implement a focused change using existing project patterns and preserve existing behavior outside scope.
4. Add or adjust tests when available; otherwise run the applicable frontend build/type-check or backend validation command.
5. Update `docs/eventhub-product-spec.md` if requirements, user-visible flows, data entities, limitations, or diagrams changed.
6. Report the behavior changed, requirement IDs addressed, files changed, and validation performed.

## Product guardrails

- Never expose password hashes, tokens, or another user's private event/shortlist data.
- Customer/provider combined accounts retain customer planning features.
- Providers must only receive their own enquiries and quote requests.
- Disabled accounts/providers must not regain access through cached UI state.
- Show success toasts only after successful writes; preserve clear error feedback.
- Do not claim payments, email notifications, background checks, or verification guarantees unless those features are explicitly implemented and documented.
- Keep mobile layouts usable, avoid nested scrolling on page content unless explicitly required, and honor reduced-motion preferences.

## Documentation output

When asked to document or revise a feature, update the product spec with:

- A testable `REQ-XXX` identifier for each new/changed requirement.
- Prioritized user scenarios with Given/When/Then acceptance checks.
- Relevant entities and role/data-access constraints.
- A Mermaid flowchart or sequence diagram for any changed cross-layer data flow.
- Explicit assumptions and limitations; do not silently convert open questions into implemented behavior.
