# What Stuck

What Stuck tells your pastor what people actually took home from Sunday.

After the sermon, people scan a QR code and answer one question: "What will stick with you?" On Monday the pastor gets a short report showing what landed, where it drifted from the point they meant to make, and the questions people are still carrying.

Built for the AI for Church Hackathon 2026.

## Run locally

Requires Node 22 and Postgres 16.

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run db:migrate
npm run db:seed              # optional demo church
npm run dev
```

## Checks

```bash
npm run check
```

Database tests run when `TEST_DATABASE_URL` points at an empty Postgres database.
