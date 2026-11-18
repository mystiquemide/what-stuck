# Judge's tour

Five minutes, with a phone and a laptop. Everything here works on the live site with no account.

**Live:** [whatstuck.midelabs.xyz](https://whatstuck.midelabs.xyz)

## 1. Be a church member (phone, 1 minute)

1. On your laptop, open the site and click **Open the demo church**, then open **Pressing On**.
2. Scan the QR code with your phone. This is what a member sees on the screen at the end of the sermon.
3. Type what stuck with you and send it. You get a thank-you with your own words, a verse, and the church's connect card as a next step.
4. Optional: send a reply like "I don't see the point of anything anymore." You'll see the 988 Lifeline, the church's care contact, and an "Ask someone to reach out" button that opens the church's own care form. This is what a hurting member sees.

Optional: set your phone to Spanish, or tap **Español** at the top of the reply page. The whole member side switches, including the crisis help and the verse.

Watch the laptop: the reply count on **Pressing On** goes up within about 10 seconds, without a reload. The demo church is shared and its replies are made up, so please keep it kind.

## 2. Be the pastor on Monday (laptop, 2 minutes)

Open **Not Finished Yet**, then **Read what stuck**. Read it top to bottom:

| Section                       | What to notice                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| One reply may need your care  | Shown first, anonymous, with the exact words. In a real church the team marks it as followed up, with a short note.           |
| You said / They heard         | The pastor's intended point next to what the room actually heard, rated Close, Partly or Mostly something else.               |
| What stuck                    | Themes with a count. Open any theme to see the real replies behind it.                                                        |
| Where it drifted              | Things people heard that the pastor didn't mean, with the replies that show it.                                               |
| Questions people are carrying | Each with a small-group prompt. Ticking up to three builds a "You asked" block to paste into next Sunday's notes or bulletin. |
| Every reply                   | All of them, word for word, so nothing the AI says goes unchecked.                                                            |

The footer of the report shows which model and prompt version wrote it.

## 3. See the series (30 seconds)

Go back and open **Philippians: Unfinished**. Three Sundays side by side show how close each one got to its point, and what stuck each week.

## 4. The Wednesday note

Members who tick "Send my words back to me on Wednesday" get one email. It holds their own words exactly as written, the passage from the Berean Standard Bible, and a question the pastor wrote or approved. Their address is deleted within 14 days. You can see the pastor's approval step on the **Pressing On** page, under **Wednesday question**, and open **Preview the Wednesday email** to see the exact email, with the real passage.

![Member reply, thank-you, and the Wednesday note](docs/screens/member.webp)

## 5. The church's own tools (1 minute)

What Stuck hands people on to the tools a church already uses, instead of keeping them in its own system.

- **Settings** (top of any pastor page): the care form and connect card links. A church pastes in its MinistryForms prayer form, a Genesis ChMS form or an In The Bulletin connect card. In the demo they open sample pages that explain where a real church's form would go.
- **For your digital bulletin** on the **Pressing On** page: button text, the reply link and an announcement to paste into In The Bulletin, so people who missed the screen can still reply.
- **Scripture:** every verse is quoted from the faith.tools Bible SDK and cited as BSB. The full Berean Standard Bible notice is in the site footer and the Wednesday email.

The README maps What Stuck to each of the [faith.tools guardrails for AI apps](README.md#faithfulness-and-responsible-ai).

## Where to look in the code

| Claim                                                   | File                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------- |
| Quotes and counts can't be invented                     | [`src/reports/grounding.ts`](src/reports/grounding.ts)          |
| Replies are data, never instructions                    | [`src/reports/prompt.ts`](src/reports/prompt.ts)                |
| Eval set: injection, Spanish, crisis, drift and more    | [`src/reports/evals/cases.ts`](src/reports/evals/cases.ts)      |
| Care check at send time, English and Spanish            | [`src/replies/care.ts`](src/replies/care.ts)                    |
| Scripture from the Bible SDK, never generated           | [`src/scripture/passage.ts`](src/scripture/passage.ts)          |
| AI budget and rate limits                               | [`src/reports/budget.ts`](src/reports/budget.ts)                |
| Demo church is read-only, churches can't see each other | [`src/auth/access.ts`](src/auth/access.ts)                      |
| Care and connect form links, https only, owner only     | [`src/churches/settings.ts`](src/churches/settings.ts)          |
| Bulletin kit                                            | [`bulletin-kit.tsx`](src/app/app/sermons/[id]/bulletin-kit.tsx) |

## Good to know

- The demo church, its people and its replies are made up. Its reports were written by the real model from those replies.
- The demo is read-only for the pastor side, so you can't break it.
- Want the full pastor side? Click **Start for your church**, sign in with the link we email you, and set up a sermon. Open its reply link on your phone, send a few replies, then build the report and watch the AI work on your own words. Each church can build up to 12 reports a day.
