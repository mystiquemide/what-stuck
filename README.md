# What Stuck

What Stuck tells your pastor what people actually took home from Sunday.

Pastors preach every week and almost never find out what landed. The feedback is "Good sermon, Pastor" at the door. What Stuck asks the congregation one question after the sermon, "What will stick with you?", and on Monday shows the pastor how close the room got to the point they meant to make.

Built for the [AI for Church Hackathon 2026](https://aiforchurch.com/hackathon), Discipleship & Spiritual Growth track.

## How it works

1. **Before Sunday:** the pastor writes one sentence, "What I want people to leave with," and gets a QR code slide for the screen.
2. **After the sermon:** people scan and answer in about ten seconds. No app, no account, no name. They can also ask a question.
3. **Monday morning:** a one-page report shows:
   - **Said vs. heard:** the pastor's intended point next to what the room actually heard
   - **What stuck:** themes, each backed by people's exact words
   - **Where it drifted:** things people heard that the pastor didn't mean
   - **Questions people are carrying**, with small-group prompts and a "You asked" block for next Sunday
4. **Wednesday:** members who opt in get their own words back by email, with the sermon's passage and one question their pastor approved.

## Responsible AI

- **Anonymous by default.** No names. An email address is only kept for the Wednesday note and deleted within 14 days.
- **Grounded.** Every theme links to the real replies behind it. The server rejects AI output that cites a reply that doesn't exist, and counts are computed in code, not by the model.
- **The pastor stays in charge.** AI organizes. The pastor reads every raw reply, picks what gets shared, and approves the Wednesday question before anything is sent.
- **No scoring.** It never grades the preacher or the sermon.
- **Care comes first.** Replies that suggest someone is hurting are flagged at the top of the report. The member sees 988 and the church's care contact right away.
- **Scripture is never generated.** Passages come from the [faith.tools Bible SDK](https://faith.tools/app/bible-sdk) (Berean Standard Bible) with attribution.
- **Safe with untrusted text.** Replies are passed to the model as data, never instructions. The model has no tools, and its output is schema-checked. A 10-sermon eval set includes prompt-injection, crisis and multilingual cases.
- **Honest under the hood.** Every report stores the model and prompt version that made it.

## Try it

Open the demo church from the home page. It's a made-up church with made-up replies, read-only, and you can send a reply from your phone and watch it arrive.

## Tech

Next.js 16 (App Router) and TypeScript, Postgres with Drizzle, Claude for the report (structured JSON output), Resend for email, Tailwind CSS. Tests use Vitest and Playwright with axe accessibility checks. CI runs typecheck, lint, unit and database tests, a production build, browser tests, a dependency audit and a secret scan.

## Run locally

Requires Node 22 and Postgres 16.

```bash
cp .env.example .env.local
```

Fill in `.env.local`, then:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Without `ANTHROPIC_API_KEY` the app runs and reports stay off. Without `RESEND_API_KEY`, emails print to the terminal in development.

## Tests

```bash
npm run check
```

Database tests run when `TEST_DATABASE_URL` points at an empty Postgres database. Browser tests run against a running app:

```bash
npm run test:e2e
```

To check the report prompt against the real model:

```bash
npm run eval:reports
```

## Deploy

The `Dockerfile` builds a small production image. On startup the app applies database migrations and creates the demo church. Scheduled jobs call three endpoints with `Authorization: Bearer $CRON_SECRET`:

| Job             | Endpoint                 | When             |
| --------------- | ------------------------ | ---------------- |
| Wednesday notes | `POST /api/cron/notes`   | every 15 minutes |
| Monday reports  | `POST /api/cron/reports` | Monday 7 AM      |
| Cleanup         | `POST /api/cron/cleanup` | daily            |

## License

MIT
