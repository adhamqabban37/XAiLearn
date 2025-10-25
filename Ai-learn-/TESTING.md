# Testing Strategy

This practical plan covers unit/integration, end-to-end, failure simulations, responsiveness, and cross-browser checks. It is designed to be executable in local dev and CI.

## Tools

- Unit/Integration: Jest + Testing Library (React, User Event)
- E2E: Cypress (with Testing Library commands)
- Accessibility: Axe (optional follow-up)
- CI: GitHub Actions running unit + e2e on Chromium and Firefox

## Areas and Test Cases

1. Auth (login/signup) with all credential combinations

- Empty inputs: submit should be blocked by required, and show helpful messages.
- Invalid email format: shows friendly error.
- Wrong password/user not found: friendly generic error (no info leak).
- User disabled: specific error.
- Too many requests: specific error.
- Network failure: mock Firebase to throw network-request-failed.
- Successful signup: creates profile, redirects to dashboard.
- Successful login: updates lastLoginAt, redirects to dashboard.

2. Forms: empty fields and invalid data

- Upload form submit with no file -> error alert.
- PDF but too short content -> error alert.
- Very large PDF (truncate path) -> still proceeds.
- All app forms must block empty required, show role=alert and aria-live messages.

3. Database operations under failure conditions

- Firestore write fails on profile create -> login still succeeds, warning logged.
- Course save: Firestore addDoc fails -> error surfaced, no crash.
- Progress update race: updating non-existent doc -> handled gracefully.

4. Network interruptions during file uploads

- Abort mid-flight -> app shows error alert and recovers to idle state.
- Server error (500) via header injection -> surfaced as friendly error.

5. Mobile responsiveness across screen sizes

- Viewports: 320, 375, 414, 768, 1024, 1280.
- Header buttons wrap appropriately, menu still reachable.
- Auth forms remain readable, focusable, and no horizontal scroll.

6. Cross-browser compatibility

- Chromium and Firefox in CI via Cypress matrix.
- Optional local WebKit/Safari run (non-CI).

## PASS/FAIL Criteria

- PASS = Expected UI state and messages appear, correct navigation, and no console errors (critical) during flows.
- FAIL = Missing or incorrect text/alerts, broken navigation, unhandled exceptions, or layout overflow on tested viewports.

## Commands

- Unit: npm run ci:unit
- E2E: npm run ci:e2e (build + start + run)
- Open Cypress: npm run e2e:open

## Local Setup

1. Install deps: npm ci
2. Dev server: npm run start:prod (in one terminal)
3. E2E: npm run e2e

## Notes

- Upload API supports failure injection via header x-test-fail: 1 or query ?fail=1 for deterministic error scenarios.
- Consider adding axe checks for a11y after core functionality is stable.
