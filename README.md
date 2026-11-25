# DATABASE — Business & Intelligence Portal

Private working portal for the **DATABASE** knowledge base (Global Business & Opportunities Intelligence).
It is a read-mostly web UI over the DATABASE Master Database. It is **not** a commercial site and not part of FinanzHelper.

> This repository contains **code only**. No records, personal data, exports or secrets are ever committed here.
> All data lives in Supabase and is protected by Row Level Security.

## Architecture

```
Google Drive: DATABASE — Master Database (Google Sheets)  ← single source of truth, edited by agents
        │  daily sync (08:00 Europe/Bratislava) + on-demand upserts by agents
        ▼
Supabase project `database-portal` (Postgres + Auth + RLS, free tier, eu-central-1)
        │  supabase-js with the publishable key (public by design)
        ▼
Static frontend on GitHub Pages  — noindex, public catalog, optional login
https://cherepaniadmytro-blip.github.io/database-portal/
```

Anyone with the link browses the public catalog without signing in. Login is an optional **Вхід** for the owner (and invited partners). The catalog reads `public_records` and, when those rows are already classified, the `catalog_facets` view (`language_group`, `platform`, `n`). The dashboard, sections, reports, history and admin stay as they were and still follow Row Level Security on `records`.

## Access levels

| Role | How you get it | Sees |
|---|---|---|
| Public / Guest | no login | the catalog (`public_records`); dashboard sections still follow RLS on `records` |
| Partner | invited by owner, email code or magic link | `PUBLIC` + `PARTNER` records in sections marked `public` or `partner` |
| Owner | Dmytro | everything; edits section visibility and invitations |

Section visibility is controlled by the owner in table `section_access` (`public` / `partner` / `owner`).
Sign-up is invite-only: a database trigger rejects any auth user whose email is not in `invited_emails` with `Sign-up is invite-only`.
The owner invites a partner by inserting their email into `invited_emails`; the partner then signs in with an email magic link / OTP.

The sidebar is built from `section_access`, so a newly inserted section shows up without rebuilding the app. Guests only see sections with `visible_to = public`; partners also see `partner`; the owner sees every section.

## Catalog

The home screen is a four-step catalog. Each step is a hash URL, so it can be shared and the browser Back button returns to the previous step. GitHub Pages does not need a rewrite for these hashes.

1. `#/` — language / nationality group, with counts
2. `#/g/<group>` — platform or type (Facebook, YouTube, Telegram, Instagram, TikTok, сайт/медіа, блогер, агенція, організація, консультант, …)
3. `#/g/<group>/p/<platform>?q=&city=&country=&status=&category=` — list sorted by `rating_score` (highest first). Rows without a score follow priority, then potential.
4. `#/g/<group>/p/<platform>/r/<id>` — public fields, source links, and added / updated / checked dates

`catalog_facets` is a view of `(language_group, platform, n)`. A null `language_group` is stored there as `Not applicable` and the catalog shows that set apart from the language groups, under **Інше / не спільноти**. Group cards use `language_group_label`. Anonymous visitors never query `records` or `update_history` (those return no rows); the catalog reads `public_records` with an explicit column list. A signed-in owner still loads `records` by explicit columns. Private notes come from `owner_notes(p_ids)` and appear on the detail card only while a session is open.

## Database (see `supabase/migrations`)

- `records` — all Master Database rows (32 sheet columns + `category` = sheet tab)
- `section_access` — per-section visibility (owner-editable)
- `update_history` — mirror of *DATABASE — Update History*
- `daily_reports` — daily/weekly/monthly report metadata with Google Docs links
- `sync_status` — last attempt / last success / errors per source (owner only); public dashboard uses `rpc('last_sync')`
- `profiles`, `invited_emails` — users and invitations
- RPC: `app_role()` → `owner | partner | public | none`, `is_owner()`, `last_sync()`

## Run locally

Requires Node.js 22.

```bash
cp .env.example .env
npm ci
npm test
npm run dev
```

Open http://localhost:5173/database-portal/ . The dev server uses the same `/database-portal/` base path as GitHub Pages.

`.env` may contain only the project URL and the publishable key from `.env.example`. Both are public by design; RLS is the access control. Never put the `service_role` key, or any other secret, in the frontend, in `.env`, or in git.

`npm run build` typechecks and writes `dist/`. `npm run preview` serves that build.

## Deploy

Pushes to `main` run `.github/workflows/pages.yml`. The workflow builds the static app and deploys it to GitHub Pages. `actions/configure-pages` is called with `enablement: true` so Pages is turned on for the repository (GitHub Actions source). Pull requests run `.github/workflows/ci.yml` (`npm test` and `npm run build`).

Live site: https://cherepaniadmytro-blip.github.io/database-portal/

Client routes use the HTML5 history API. GitHub Pages has no server rewrites, so `public/404.html` sends unknown paths back to `index.html`, which restores the path before React Router starts. Magic-link tokens stay in the URL hash and are not part of the route.

## Supabase Auth URLs

The owner must set both of these in the Supabase dashboard, or magic links will be rejected:

1. **Authentication → URL Configuration → Site URL**
   `https://cherepaniadmytro-blip.github.io/database-portal/`
2. **Authentication → URL Configuration → Redirect URLs**
   `https://cherepaniadmytro-blip.github.io/database-portal/`

For local sign-in, also add `http://localhost:5173/database-portal/` to Redirect URLs.

The app uses the implicit magic-link flow and sends `emailRedirectTo` as `window.location.origin` plus the base path (`https://cherepaniadmytro-blip.github.io/database-portal/` on the live site). The login form asks for the 6-digit code first. The code is delivered only if the Magic Link email template includes `{{ .Token }}`. The link in the same letter uses `{{ .ConfirmationURL }}`.

## Invite a partner

The owner email is seeded in the database (`invited_emails`) and is not stored in this repo. Sign in with that address, then open **Адміністрування**:

- Change a section's visibility (`public` / `partner` / `owner`). The sidebar follows `section_access` on the next load.
- Add a partner email and role (`partner` or `owner`), or remove one.
- Read `sync_status` (attempts, errors, row counts). Guests never see this table; the dashboard clock uses `last_sync()`.

The same invitation can be inserted in the SQL editor:

```sql
insert into public.invited_emails (email, role, note)
values ('partner@example.com', 'partner', 'optional note');
```

The partner then opens the portal and requests a magic link. An address that is not in `invited_emails` is rejected. The login screen shows that as «Реєстрація лише за запрошенням» together with the server text `Sign-up is invite-only`.

Removing an invitation blocks a future sign-up. It does not delete an account that already exists.

## What the UI computes

Dashboard figures are counted in the browser from the rows the current session is allowed to read:

- total visible records
- new today — `date_added` is today in Europe/Bratislava
- updated today — `last_updated` is today and `date_added` is earlier
- new jobs / partners / business opportunities — that section, status `NEW` or added today
- top 10 — priority weight (P1 highest) × 10 + potential
- latest `update_history` rows and `last_sync()`

Section, search, and archive tables filter and sort on the client. CSV export downloads the current filtered rows (every page of that filter), with a UTF-8 BOM. New rows (`date_added` today) and updated rows (`last_updated` today, added earlier) are marked. Status colours: green VERIFIED/ACTIVE/COMPLETED, blue NEW, yellow NEEDS REVIEW, orange IN PROGRESS/CONTACTED/WAITING, red EXPIRED, grey ARCHIVED.

The catalog is separate: it sorts by `rating_score` and filters city, country, status and category in the browser from `public_records`.

## Privacy

- `index.html` sends `<meta name="robots" content="noindex, nofollow">`.
- `public/robots.txt` is `Disallow: /`.
- noindex / hidden URLs are **not** security; access control is enforced by Supabase RLS.
