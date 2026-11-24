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
Static frontend on GitHub Pages (this repo)  — noindex, magic-link login
```

## Access levels

| Role | How you get it | Sees |
|---|---|---|
| Public / Guest | no login | records with Access Level `PUBLIC` in sections marked `public` |
| Partner | invited by owner, magic link login | `PUBLIC` + `PARTNER` records in sections marked `public` or `partner` |
| Owner | Dmytro | everything; edits records, sections, invitations |

Section visibility is controlled by the owner in table `section_access` (`public` / `partner` / `owner`).
Sign-up is invite-only: a database trigger rejects any auth user whose email is not in `invited_emails`.
The owner invites a partner by inserting their email into `invited_emails`; the partner then signs in with an email magic link / OTP.

## Database (see `supabase/migrations`)

- `records` — all Master Database rows (32 sheet columns + `category` = sheet tab)
- `section_access` — per-section visibility (owner-editable)
- `update_history` — mirror of *DATABASE — Update History*
- `daily_reports` — daily/weekly/monthly report metadata with Google Docs links
- `sync_status` — last attempt / last success / errors per source (owner only); public dashboard uses `rpc('last_sync')`
- `profiles`, `invited_emails` — users and invitations
- RPC: `app_role()` → `owner | partner | public | none`, `is_owner()`, `last_sync()`

## Frontend config

Copy `.env.example` to `.env`. Only the project URL and the publishable key are allowed in the frontend.
Never use the `service_role` key outside the server-side sync.

## Privacy

- Add `<meta name="robots" content="noindex, nofollow">` and a `robots.txt` disallowing all.
- noindex / hidden URLs are **not** security; access control is enforced by Supabase RLS.
