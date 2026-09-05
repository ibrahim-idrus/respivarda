# SmokeWatch Admin Login Design

**Date:** 2026-09-05  
**Status:** Approved direction; ready for written-spec review  
**Scope:** UI-only admin entry point

## Goal

Add a dedicated `/admin/login` page for SmokeWatch administrators. The page should make the role boundary obvious: guests continue to read the public pollution insights and map, while admins use a separate entry point to reach future Telegram-user operations data.

This pass is intentionally visual and local-only. It does not validate credentials, create sessions, call `next-auth`, protect routes, load Telegram data, or implement the admin dashboard itself.

## Experience

The page uses the existing SmokeWatch visual language: Plus Jakarta Sans, a pale blue-white canvas, navy primary surfaces, teal secondary accents, rounded cards, and Phosphor icons.

On desktop, the page is a responsive two-panel composition:

- **Admin sign-in card:** a compact brand lockup, an “Admin access” eyebrow, the heading “Sign in to Operations,” supporting copy about Telegram user activity and alert delivery, an email field, a password field with a visibility toggle, a “Keep me signed in” checkbox, a primary “Sign in to admin console” button, and a return link to the public dashboard.
- **Operations preview panel:** a dark navy information panel labeled as a secure operations workspace, with a small live-status indicator and clearly marked preview metrics for Telegram subscribers, alerts delivered, and sensors online. A role note states that guest access remains open to the public dashboard and pollution map.

On smaller screens, the sign-in card appears first and the operations preview stacks below it. The preview remains informative rather than becoming a required interaction.

The public header receives a discreet “Admin access” link so the route is discoverable without changing the guest dashboard’s primary flow.

## Components and route boundaries

The route follows the App Router conventions already used by the project:

- `app/admin/login/page.tsx` is a server-rendered route entry and owns page metadata for the admin login surface.
- `src/components/admin/AdminLogin.tsx` is the client component responsible for form state, password visibility, validation feedback, and the demo submission state.
- A small presentational preview component may be colocated under `src/components/admin/` if it keeps the interactive login component focused.
- Existing global tokens in `app/globals.css` and existing icon/button dependencies are reused. No new design system or image asset is introduced.

The current public dashboard remains the guest experience at `/`. No admin layout, proxy, session helper, or database access is added in this pass.

## Interaction and data flow

1. The server page renders the static shell and passes no sensitive data to the client.
2. The client component owns only the email value, password value, password visibility, checkbox state, validation messages, and whether the demo submission has been acknowledged.
3. Submitting an empty or malformed form shows accessible inline feedback and keeps focus in the form.
4. A locally valid submission does not make a network request or navigate. It shows a neutral “Preview only — authentication is not connected yet” status so the UI does not imply that a real credential check occurred.
5. The public-dashboard link navigates to `/` using Next’s `Link` component.

There is no role selector. The route itself communicates that it is for administrators, preventing guests from being encouraged to self-identify as admins.

## Error and empty states

- Use native email/password semantics (`type`, `required`, `autoComplete`) plus deterministic inline messages for invalid form submissions.
- Associate each message with its input using `aria-describedby` and expose submission status through an `aria-live` region.
- Keep the demo status visually distinct from an authentication success state; it must not say that the user is signed in.
- The password visibility control is a labeled button and never changes the stored value.
- No “forgot password” flow is presented because there is no recovery backend in scope.

## Accessibility and responsive behavior

- Every form control has a visible label and a stable `id`/`htmlFor` pair.
- Keyboard focus is visible on inputs, the password toggle, checkbox, links, and submit button.
- Contrast is maintained against both the light form card and dark preview panel.
- The preview metrics are supplemental content and remain readable when the layout stacks.
- Motion is limited to short color/opacity transitions; no essential information depends on animation.

## Verification

The implementation will be verified with:

- a focused test-first check for the login form’s validation behavior;
- a production build and lint run from the isolated worktree;
- a route smoke check confirming `/admin/login` renders successfully;
- manual responsive and keyboard checks against the running development server.

The existing lint warning in `lib/airvisual/rule-engine.ts` is pre-existing and unrelated to this feature.

## Out of scope

- Real administrator credentials or password hashing
- `next-auth` configuration, cookies, sessions, proxy protection, or authorization checks
- Telegram OAuth or Telegram user data loading
- Admin dashboard pages, tables, filters, exports, or analytics
- Guest sign-in or guest account creation
