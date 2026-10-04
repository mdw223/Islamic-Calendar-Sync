# Project Timeline

Last updated: 2026-10-04 (notes audit applied to the board later the same day)

This is the working roadmap for Islamic Calendar Sync from "where the board actually is" to a polished, complete product: rich event descriptions, test coverage, open source, multi-provider auth/calendar sync, managed hosting, and a public launch.

**Definition of "complete" used here:** a polished product — content-rich Learn/descriptions, tests, open source, multi-provider. Prayer times (`#78`), TypeScript (`#83`), and the V2 habit-tracker/mobile ideas (`#90`) sit **after** that line, not on it.

**Budget:** ~10 hrs/week, no hard deadline. Event Descriptions work runs in parallel the whole time at ~3 hrs/week rather than blocking everything else.

**Manual estimate: ~19 weeks at 10 hrs/week (~190 hrs).**
**AI-accelerated estimate: ~11 weeks at 10 hrs/week (~105 hrs)** — see methodology below. This is the number to plan against. The bump from the earlier ~85 hrs is the notes-audit items folded into phases 2 and 5–10 (auth decision, SAST, feedback form, subscribe UX, small calendar/settings UX, launch marketing).

### Why AI-accelerated is ~40% faster, not 90% faster

Building with an AI pair compresses *coding, boilerplate, and content-drafting* time hard — scaffolding a test runner, writing an OAuth strategy, generating meta tags/sitemaps/JSON-LD, drafting README/LICENSE copy, fixing a click-handler bug. It does **not** compress:

- **Reading the book for Event Descriptions** (`#34`) — this is inherently human-paced research, not a coding task. AI drafting the short/long blurbs from your notes is near-instant; the reading and note-taking is the real bottleneck and stays at the same pace.
- **External waits** — Google OAuth app review, DNS propagation, domain verification. These are wall-clock, not hands-on hours, and can add calendar days even though they cost ~0 of your actual time.
- **Account setup / manual console clicks** — creating Fly/Render/Cloudflare accounts, registering OAuth apps in each provider's console. Faster with AI guiding you step-by-step, but still real minutes you spend clicking.

Phase-by-phase breakdown below reflects this: phases that are mostly code/content (3, 5, 7, 8, 9) compress by ~55-60%; Event Descriptions (2) barely compresses (~20%, drafting only); the VPS migration and multi-provider auth (4, 6) land in between because they mix fast AI-written config with slower manual account/console work.

Board: [ICS_Tasks](https://github.com/users/mdw223/projects/4/views/1)

---

## 1. Board status audit (applied 2026-10-04)

The board was checked against the actual code and brought up to date. Every change below is already live on the board, each with a comment on the issue citing the evidence.

### Closed as Done (code confirmed complete)

| Issue | Why |
|---|---|
| `#17` Make an architecture diagram | `docs/report/architecture_diagram.png`, `ICS_Low_Level_Design.png` exist |
| `#19` logging for production | Winston + Postgres transport wired in `api/src/index.js` |
| `#20` Complete Settings Page | `app/src/pages/app/settings/Settings.jsx` covers profile, subscribe URLs, locations, deletion |
| `#22` push my project to my personal github | repo is live at `mdw223/Islamic-Calendar-Sync` |
| `#24` deploy | `.github/workflows/deploy-vps.yml` + `compose.prod.yml` work today — closed for the VPS era, superseded by the migration in section 5 |
| `#38` Subscribe URL | full create/list/update + ICS feed endpoints exist |
| `#36` Final Report | `docs/report/FINAL_REPORT.md` + the `.docx` exist |

### Kept open, re-scoped by comment (partially done)

| Issue | What's actually left |
|---|---|
| `#37` offline ability | Dexie + PWA plugin already wired — add the missing PWA icons under `app/public/` + verify the install prompt |
| `#35` Make a Test Deployment | will ride on the Fly.io migration (section 5) — Fly preview deploys / Render branch DBs give a free staging environment, replacing the old VPS-based `compose.test.yml` plan |
| `#62` Write GitHub README and About | `docs/README.md` is a solid hub already — just needs a root `README.md` linking into it |
| `#65` Brand magic-link confirmation HTML | confirmation page + email HTML exist but are generic — add logo/brand colors |

### Closed as Won't-Do / superseded

| Issue | Why |
|---|---|
| `#73` Fix VPS deploy SSH | superseded by the VPS migration — no VPS, no SSH key to fix |
| `#74` Harden VPS deploy off root | superseded by the same migration — Fly/Render have no root-login surface |
| `#64` Update `.env.prod` | superseded — secrets move to GitHub Environments + `fly secrets`, no more file to hand-edit |

### Closed as duplicate

| Issue | Why |
|---|---|
| `#71` Add more automated tests | folded into `#33` Front end testing — same underlying gap |

### Left untouched — genuinely not started

`#14` Cron jobs, `#15` Nodemailer OTP emails (confirmed still wanted as a second login option alongside magic link), `#18` Admin page, `#33` Front end testing, `#21` Add Additional Auth Providers, `#26` Add Calendar Providers, `#66` Fix vulnerabilities, `#67` Fix search, `#69` lower-event click bug, `#70` default-to-All-Events-logged-out, `#68` Publish Google Auth app (can't verify Google's app-verification status from code — confirm yourself), `#25` Make open source, all the Oct 4 feedback items (`#54`-`#61`, `#69`-`#74`).

### Deferred past "complete" (stretch goals, not on the critical path)

`#29` chrome extension, `#30` browser background. After the notes audit: `#78` prayer times, `#83` TypeScript, `#16`+`#82` public versioned API, `#90` V2 epic — see section 7.

**Board totals after the first audit:** 31 Backlog, 2 Ready, 1 In progress, 1 In review, 26 Done. `#75`–`#77` were created next (now 34 Backlog). Notes-audit issues `#78`–`#90` landed later the same day — current totals are in section 7.

---

## 2. Phased roadmap

| Phase | Weeks (AI-accel) | Hours: manual → AI-accelerated | Scope |
|---|---|---|---|
| 1 | 1 | ~8 → **~5** | Board triage (done), root README, PWA icons, magic-link branding, set up the Event Descriptions note-taking pipeline (section 3) |
| 2 | 1-7 (parallel, ~3 hrs/wk) | ~28 → **~22** | Event Descriptions end-to-end (sections 3-4) — reading/notes stay human-paced, only the drafting step speeds up. Also add the missing Mon/Thu and Shawwal-six event types (`#28`) |
| 3 | 1-2 | ~20 → **~9** | Reliability — front-end test runner (`#33`), cron jobs (`#14`), lower-event click bug (`#69`), fix search (`#67`), default-All-Events-logged-out (`#70`) |
| 4 | 2-3 | ~16 → **~10** | Migrate off the VPS to managed hosting — Fly.io + Render Postgres + Cloudflare Pages + Upstash Redis (section 4) |
| 5 | 3-5 | ~32 → **~15** | Remaining security/infra — fix vulnerabilities (`#66`), minimal admin page (`#18`), auth decision + JWT revocation or session migration (`#80`), SAST / threat model (`#81`), structured feedback form (`#85`) |
| 6 | 5-7 | ~28 → **~17** | Multi-provider & auth — additional auth providers (`#21`), Nodemailer OTP login (`#15`), calendar providers beyond ICS subscribe (`#26`), subscribe URL one-click add + filters (`#86`), confirm Google OAuth app publish status (`#68`, external review wait not counted in hours) |
| 7 | 7-8 | ~21 → **~10** | UX polish from feedback — `#55`-`#61`, `#31`, `#72`, date converter (`#79`), settings account email (`#84`), overlapping fasting-day UI (`#87`) |
| 8 | 8-9 | ~10 → **~4** | Analytics & SEO (section 5) |
| 9 | 9 | ~11 → **~6** | Open-source readiness — repo visibility/License/CONTRIBUTING (`#25`), accept GC testers (`#54`), verify Fly preview-deploy staging (`#35`), Beta badge (`#88`) |
| 10 | 9-11 | ~14 → **~9** | Launch — root README/About (`#62`), portfolio + LinkedIn + mentor shoutout (`#63`), outreach / demos / survey (`#89`) |

**Total: manual ~190 hrs (~19 weeks) → AI-accelerated ~105 hrs (~11 weeks)** at 10 hrs/week.

Post-complete (not in the total): prayer times (`#78`, ~25 hrs → ~12), TypeScript (`#83`), public API versioning (`#16` + `#82`), V2 (`#90`). See section 7.

---

## 3. Event Descriptions (`#34`): the real scope is smaller than "read 500 pages"

The 27 calendar events map onto only **13 real research topics**, because Ibn Rajab's book has no dedicated chapter for several months (Rabi' al-Thani, Jumada al-Awwal, Jumada al-Thani get a short generic blurb instead of forced content), and several events bundle under one chapter (e.g. all 6 Dhul-Hijjah events share one chapter/reading session).

| # | Topic | Hours |
|---|---|---|
| 1 | Muharram (+ Islamic New Year, Ashura) | ~2.5 |
| 2 | Safar | ~1 |
| 3 | Rabi' al-Awwal (+ Eid Mawlid — sensitive, keep descriptive/historical) | ~2 |
| 4 | Rabi' al-Thani / Jumada al-Awwal / Jumada al-Thani (no book chapter) | ~1.5 total |
| 5 | Rajab (+ Isra & Miraj — sensitive) | ~2 |
| 6 | Sha'ban (+ Shab-e-Barat — sensitive) | ~2 |
| 7 | Ramadan (+ Last 10 Nights, Laylatul Qadr) | ~4 (richest chapter) |
| 8 | Shawwal (+ Eid al-Fitr) | ~1.5 |
| 9 | Dhul-Qa'dah | ~1 |
| 10 | Dhul-Hijjah mega-topic (+ Dhul Hijjah Begins, First 10 Days, Hajj, Arafah, Eid al-Adha, Tashreeq) | ~4 |
| 11 | White Days (recurring monthly fast) | ~1 |

**Total ≈ 25 hours** for all 27 events, not 500 pages of blind reading. This is the one phase AI barely speeds up (~20 hrs AI-accelerated, see the note on methodology above) — the hour numbers above are mostly reading + note-taking, which stays at your pace regardless of tooling. Steps 2-3 in the drafting workflow below (writing the short/long blurbs from your notes) are the part AI compresses to near-zero; review in step 4 is still yours.

### Sources

- **Primary (already owned):** *The Islamic Months*, trans. Mahomed Mahomedy, Dar al-Kotob al-Ilmiyah, 2014, 592pp.
- **Fast-start condensed English summary:** *Righteous and Virtuous Deeds* (Hikmah Publications, 322pp) — abridged, month-by-month, action-focused. Use for a quick first-pass draft before going deeper.
- **Free English per-month extracts with citations:** IslamQA's "Fiqh of Islamic Months" series (Qibla Hanafi) — directly extracts and cites Ibn Rajab per month (confirmed for Muharram; check for others). Good for cross-checking notes.
- **Supplementary verification only:** SeekersGuidance month-specific virtue Q&As (e.g. Rajab, Ramadan) — sanity-check only, not a replacement for the book.

**Guardrail for AI drafting:** never reproduce long verbatim passages of the copyrighted translation. Draft from structured notes (facts + page refs in your own words), citing Quran by surah:ayah and hadith by collection+number, same style as the existing `Learn.jsx` citations.

### Note-taking pipeline (iPad → AI, no OCR, git-friendly)

- **App:** Obsidian (free, plain Markdown, official iPad app).
- **Sync:** Syncthing on the Linux machine + Möbius Sync (Syncthing-compatible) on iPad — free, automatic, no cloud subscription. Vault syncs straight into `docs/research/event-notes/` in this repo in real time.
- **One file per topic**, fixed template so notes parse reliably:

```markdown
# <Topic name>
Book pages: pXX-YY (The Islamic Months, trans. Mahomedy)
Also checked: <Righteous and Virtuous Deeds p.XX / IslamQA series link / none>

## Key facts (your words)
- ...

## Virtues / significance
- ...

## Recommended acts
- ...

## Quran / hadith references
- ...

## Notes on debated/sensitive angles (if any)
- ...
```

### Drafting workflow per topic

1. Read the note file.
2. Draft a **short blurb** (~150-280 chars / 2-4 sentences) for the event's `description` field in `islamicEvents.json` (shows in calendar + ICS export).
3. Draft a **long writeup** (~300-600 words, cited) for `app/src/pages/learn/Learn.jsx`, replacing the current placeholder `draftSummaries`.
4. Review/edit both before merging — no auto-publish.

---

## 4. Move off the VPS to managed hosting

Based on the personal "Hosting Tech Stack" notes (Obsidian vault, outside this repo), scaled down from "10 isolated apps under $200/mo" to **one app**. Same principles (no server to patch/SSH into, isolated managed pieces, no idle Postgres), much cheaper:

- **Frontend:** Cloudflare Pages, replacing the current GitHub Pages build (`build-frontend.yml`). Free tier is enough for one site.
- **API:** Fly.io app (region `iad`), deployed from the existing Dockerfile — no rewrite needed, just a `fly.toml` and `fly deploy`. `shared-cpu-1x` with autostop — **~$0-5/month**.
- **Database:** Render Postgres **Basic-256mb** (~$6/month), always-on, 3-day PITR included, replacing the self-hosted Postgres container on the VPS. One-time `pg_dump`/`pg_restore` migration.
- **Redis (rate limiting):** Upstash Redis free tier, replacing the self-hosted Redis container.
- **Secrets:** GitHub Environments + `fly secrets set` — no Doppler needed at this scale, no more `.env.prod` file to SSH in and edit.
- **Uptime:** Better Stack free tier.
- **CI/CD:** GitHub Actions → `fly deploy` (API) + Cloudflare Pages deploy (frontend). No SSH, no VPS, nothing to patch.

**Target cost: ~$6-12/month**, and it directly retires the SSH/root/`.env.prod` headaches closed in section 1.

### Why Fly.io (also: best option for hosting many Docker apps on one plan)

The Hosting Tech Stack notes already settled this for the 10-app case, and it holds for ICS too. Each project gets its own Fly "app" (own machines/env/volume) under one Fly org; autostop scales an idle app to ~$0; Fly is explicitly cheaper than Render for many small containers per those notes. Railway Pro (~$20+usage) is simpler DX but a flat fee regardless of app count — it stops being cheap past one or two projects. Keep Postgres on Render (one instance per app, never Fly's own managed Postgres — flagged as "reject" at ~$38/instance). Reuse this same Fly-org + Render-per-app pattern for any future Dockerized project.

### Migration steps (~16 hrs manual → ~10 hrs AI-accelerated)

Config/workflow-writing steps compress hard with AI; account creation, data migration execution, and DNS propagation stay closer to real time.

1. Create Fly.io, Render, Cloudflare, Better Stack accounts/projects — 1 hr → 1 hr (manual clicking)
2. Write `fly.toml`, deploy API container to Fly, verify against existing Dockerfile — 3 hrs → 1.5 hrs
3. Provision Render Postgres, `pg_dump`/`pg_restore` data from the VPS DB — 3 hrs → 2.5 hrs (execution + validation still takes real time)
4. Provision Upstash Redis, point rate-limit config at it — 1 hr → 0.5 hr
5. Cloudflare Pages project for the frontend, verify build — 2 hrs → 1 hr
6. Move secrets into GitHub Environments + `fly secrets` — 1 hr → 0.5 hr
7. Rewrite `.github/workflows/deploy-vps.yml` into Fly + Cloudflare deploy workflows — 2 hrs → 0.5 hr
8. Better Stack monitor + DNS cutover — 1 hr → 1 hr (DNS propagation is wall-clock, not hands-on)
9. Validate end-to-end in production, decommission the VPS — 2 hrs → 1.5 hrs

---

## 5. Analytics & SEO

**Analytics:**
- **Cloudflare Web Analytics** — free, no cookie banner needed, ships automatically once the frontend is on Cloudflare Pages.
- **Google Analytics 4** — free, paired with Search Console for behavioral + search data together.

**SEO** (scoped to the public marketing/landing pages — authenticated `/app/*` pages stay `noindex`):
- Meta title/description + Open Graph + Twitter Card tags on the landing page.
- `sitemap.xml` and `robots.txt` (disallow `/app/*`, allow marketing routes).
- JSON-LD structured data (`SoftwareApplication` or `WebSite`) on the landing page.
- Verify the domain in Google Search Console, submit the sitemap.

**~10 hrs manual → ~4 hrs AI-accelerated:** GA4 + Cloudflare Analytics setup (2 hrs → 1 hr), meta/OG/Twitter tags (2 hrs → 0.5 hr), sitemap + robots.txt + noindex gating (2 hrs → 0.5 hr), JSON-LD (2 hrs → 0.5 hr), Search Console verification + submit (2 hrs → 1.5 hrs, domain verification/DNS is manual).

---

## 6. Notes audit applied to the board

Source: personal Obsidian note. Every uncrossed item is now either a comment on an existing issue, a new issue, explicitly skipped, or parked on the V2 epic.

### ⚠️ Date-converter discrepancy — resolved

The notes had "Date converter between gregorian and hijri (in navbar)" marked done. Confirmed **not built**: navbar has no converter, `HijriUtils` is Gregorian → Hijri only. Re-opened as `#79`.

### New issues created

| Issue | What | Phase |
|---|---|---|
| `#75` | Migrate off VPS to managed hosting (Fly.io + Render Postgres + Cloudflare Pages) | 4 |
| `#76` | Analytics (Cloudflare Web Analytics + GA4) | 8 |
| `#77` | SEO for marketing pages | 8 |
| `#78` | Prayer times (navbar, monthly table, methods, qibla, masjid) | post-complete |
| `#79` | Hijri ↔ Gregorian date converter in the navbar | 7 |
| `#80` | Auth decision: sessions vs JWT revocation | 5 |
| `#81` | SAST + threat modeling | 5 |
| `#82` | API `/v1` versioning and documentation | post-complete (with `#16`) |
| `#83` | Migrate API to TypeScript | post-complete |
| `#84` | Show signed-in account email on Settings | 7 |
| `#85` | Structured feature-request / bug-report form | 5 |
| `#86` | Subscribe URL: one-click provider add + filter customization | 6 |
| `#87` | Special calendar UI for overlapping fasting days | 7 |
| `#88` | Add a Beta badge to the site | 9 |
| `#89` | Launch marketing: outreach, demos, survey, swag | 10 |
| `#90` | V2 backlog epic (habit tracker, mobile, makeup tracker) | deferred |

### Mapped onto existing issues (comment added, no new issue)

| Existing issue | What the notes added |
|---|---|
| `#34` Event Descriptions | dawah/encouragement page + share popup, Learn-page preface from the book intro, downloadable PDF, hadith sourcing, default duas in descriptions, seerah as a follow-on, SEO the Learn pages |
| `#28` Add more Islamic Days | Mon/Thu sunnah fasting and 6 days of Shawwal as **new event types**; seerah/companions later |
| `#26` Add Calendar Providers | two-way OAuth sync research, change-provider later, cal.com docs, optional paid auto-sync |
| `#67` Fix search results | search should hit write-ups once `#34` content exists |
| `#18` Admin page | monitor sign-ups; then `#85` + `#54` |
| `#68` Publish Google Auth app | "allow sign-ups in Google Cloud" |
| `#54` Accept GC testers | get beta testers / announce beta / show friends |
| `#63` Update portfolio/LinkedIn | mentor shoutout, teaser, v1 LinkedIn post |
| `#77` SEO for marketing pages | top-of-Google goal; also SEO public Learn pages |
| `#25` Make open source | "setup repo for opensource" |
| `#29` / `#30` Chrome extension / browser background | rationale only (reminders, learning project, holiday notifications) |
| `#31` Versioning popup | already this issue |
| `#75` VPS migration | Docker Hub + "scaling cloud" superseded; HTTPS at cutover; Better Stack logs + Slack alerts; hold off documenting the old VPS setup |
| `#16` make backend API public | pair with `#82` `/v1` + docs |
| `#23` integration testing | curl + nginx/proxy checks |
| `#27` emailUpdates / notifications | holiday-near popups (virtues, date, how-to link); prayer popups wait on `#78` |
| `#32` testing/coverage workflows | BlinkDoc GH Actions note is too vague — add concrete diffs here when known; VPS auto-pull half superseded by `#75` |
| `#57` landing-page goal messaging | product description + room for demo videos; Loom production is `#89` |
| `#58` unique font | Dribbble / Dua composer as visual reference only |

### Explicitly not turned into issues

- **Lovable mock / waitlist** — the real app and landing page already exist.
- **Organize notes on the laptop / add old todos to the board** — this pass.
- **HTTPS as its own task** — comes with `#75` (Fly + Cloudflare).
- **Document the current VPS / Vercel setup now** — would go stale the moment `#75` lands.
- **Pure reference** in the notes (tool links, Islamic resource links, Dockerfile/logging snippets, full OAuth and Passport research blocks).

---

## 7. Board totals and post-complete

**Board totals after applying the notes audit:** 47 Backlog, 2 Ready, 1 In progress, 1 In review, 26 Done.

### After "complete" (not on the 11-week critical path)

| Issue | Why it waits |
|---|---|
| `#78` Prayer times | Entirely new product surface. Scaffolding exists but nothing is wired. Roughly ~25 hrs manual → ~12 AI-accelerated once started. |
| `#16` + `#82` Public versioned API | Useful, not required to ship the polished app. Do it when you actually want third-party consumers. |
| `#83` TypeScript migration | Compile-time safety, no user-facing change. |
| `#29` / `#30` Chrome extension / browser background | Already deferred stretch goals. |
| `#90` V2 epic | Habit tracker, prayer makeup, hasanat, zakat, hifdh, iPhone widgets, provider-calendar prayer color blocks, DeenPal rebuild. Separate product phase. |
