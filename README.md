# MOJATECH Electrical Enterprises: website and admin app

The public website at **mojatechelectrical.com**, and **MOJATECH Admin** at `/admin`:
an installable phone app for running the business, with Arik, the AI assistant.

Built with **Next.js 16 (App Router), React 19 and TypeScript**, hosted on **Vercel**,
data in **Neon Postgres**.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000 (admin at /admin)
npm run build      # production build: run before pushing
```

Settings go in `.env.local` (see **`.env.example`** for every key and where to get it).
Use a separate Neon **dev** branch locally so testing never touches live data.

## The website

| Address | Page |
| --- | --- |
| `/` | Home |
| `/about`, `/careers`, `/contact` | About, careers (application form), quote form |
| `/services`, `/services/[slug]` | Services |
| `/products`, `/products/[slug]` | Products, managed in the admin |
| `/work`, `/work/[slug]` | Work gallery, managed in the admin |
| `/review` | Customers leave a review (approved in the admin before it shows) |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | Generated automatically |

Fixed company details (phone, address, services) live in `lib/data/`.
Products, projects and reviews are edited in the admin.

## The admin app (`/admin`)

Installable on phones (Add to Home Screen) with its own icon, a swipe-out side menu,
offline screen and phone alerts.

| Section | What it does |
| --- | --- |
| **Arik** | AI assistant: chat, documents (PDF, Word, Excel), photos, voice typing, hands-free voice, pictures (create and edit), reminders from plain words. Knows the business data each person's role allows. |
| **Schedule** | Reminders, site visits, jobs, deliveries; alerts at the chosen time; alarms; repeats. |
| **Enquiries** | Quote requests, orders and job applications from the website, with status, notes and follow-ups. |
| **Products** | Catalogue: prices, photos, stock, show/hide, drag to reorder. |
| **Work** | Projects with photos and stories. |
| **Reviews** | Approve, publish, add and share the review link. |
| **Team** | Accounts and roles (Owner, Manager, Sales, Editor), activity log. Owners only. |

**Sign-in:** each person has an email and password. The master password
(`ADMIN_PASSWORD`) is for first setup and recovery.

**AI services** (all free tiers, used one after another when one is busy):
Groq, Google Gemini, Mistral, OpenRouter for text; Groq Whisper for voice typing;
Fish Audio for the speaking voice; Cloudflare Workers AI (FLUX.2) for pictures.
Code: `lib/arik/`.

**Alerts and the clock:** phone notifications use Web Push (keys are created
automatically). Reminders, follow-up nudges and the 7:30am briefing run from
`/api/cron/tick`, called every 5 minutes by cron-job.org with
`Authorization: Bearer <CRON_SECRET>`, plus a daily Vercel cron as a backstop.

## Where things are

```
app/(site)/          the public website
app/admin/           the admin app (pages in app/admin/(app)/, APIs in app/admin/api/)
app/api/             public endpoints: enquiry, review, cron
components/site/     website pieces       components/admin/   admin pieces
lib/store.ts         database tables (created automatically on first use)
lib/admin-auth.ts    accounts, roles, sessions
lib/arik/            the assistant        lib/push.ts, lib/schedule.ts   alerts and schedule
public/admin-sw.js   the admin app's service worker (offline, alerts)
```

## Security notes

- Strict Content Security Policy and security headers (`next.config.mjs`); the admin
  additionally allows the microphone and audio playback.
- Passwords hashed with scrypt; sessions stored as fingerprints; sign-in lockout after
  6 failed tries; every admin page and action checks the person's role on the server.
- Website forms have spam traps and per-visitor limits.
- Keys and passwords live only in `.env.local` and Vercel, never in the code.
