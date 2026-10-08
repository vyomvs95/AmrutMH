# AMRUT Maharashtra — back office

This folder is the staff side of the portal: where district coordinators write
stories, divisional heads check them, and the head office publishes them.

It is **self-contained**. Copy this one folder to any server that runs Node.js,
fill in the settings file, and it runs. Nothing outside this folder is needed,
and no account with any outside service is required.

---

## What is here today

**Session 1 — the foundation**

- Sign in, sign out, and a locked door around everything else
- The three permission levels AMRUT described:
  **district coordinator → divisional head → head office editor**
- Maharashtra's 6 divisions and all 36 districts, and the portal's 16 sections
- Unguessable page addresses (see *Addresses* below)
- A record of who signed in and when

**Session 2 — the editorial workflow**

- A district coordinator writes a story: headline, section, body in Marathi,
  and up to 8 photographs
- Save as a draft, come back and edit it
- Send it for review; the divisional head approves it or sends it back with a
  reason; the head office editor publishes it
- Each person sees only what they should: a coordinator sees their own district,
  a divisional head their division, the editor everything
- Photographs are checked by their actual contents, not their file name, and are
  served only to people allowed to see that story
- Every step is written to the record: created, edited, submitted, approved,
  sent back, published

**Session 3 — photographs that load on a weak connection, and the public read path**

- Every photograph uploaded is now also written as WebP at **400, 800 and 1400
  pixels wide** — the same three sizes the public portal already uses. A 1600px
  camera photograph of 10 KB becomes 274 bytes at 400 wide. The original is kept
  untouched. `npm run images` does the same for anything uploaded earlier.
- A **public read path at `/api`**, open to anyone, that serves **published
  stories only**: the 16 sections with counts, a page of stories, one story in
  full, and photographs at whichever size is asked for. Drafts, stories awaiting
  review and their photographs return "not found" to the public — tested.
- `npm run export` writes every published story out as plain JSON files in
  exactly the shape the current site already uses, as a bridge until the office
  is reachable from the internet.
- Database changes now go through numbered migration files, each applied inside
  a transaction and recorded, so AMRUT's team can see what changed and when.

**Session 4 — the office and the portal joined up**

A story published in the office now appears on the public portal, opens as a
full article, and carries its photographs at the right size. The front-end
change is in `src/lib/office.js` in the main project, and it works whichever way
the hosting question lands:

1. **Office reachable from the internet** — build the site with
   `VITE_OFFICE_API=https://<their-domain>/api` and new stories appear the moment
   they are published. Nothing to rebuild, nothing to copy.
2. **Office behind a firewall** — run `npm run export` here, commit the output
   into `public/data/office` and `public/img`, and they go live with the next
   build of the site.
3. **Neither set** — the portal behaves exactly as it does today. Verified: a
   production build with nothing configured shows the archive and no office
   stories, with no errors.

This runs on **PostgreSQL 18**, tested end to end, which is the database AMRUT
confirmed as their standard.

---

## Running it on this machine

You need Node.js 22.5 or newer. Check with `node -v`.

```bash
cd server
cp .env.example .env     # the settings file
npm run db:start         # starts a PostgreSQL just for this machine
                         # (copy the DATABASE_URL it prints into .env)
npm install pg
node db/seed.js          # creates the tables and the starting accounts
node src/server.js       # starts the office
```

`npm run db:start` uses a PostgreSQL that came with the development package —
nothing is installed into macOS and no admin rights are needed. `npm run db:stop`
stops it. To work without any database at all, leave `DATABASE_URL` empty in
`.env` and the office falls back to a single file, `data/amrut.db`.

### The commands

| Command | What it does |
|---|---|
| `npm start` | runs the office |
| `npm run db:start` / `db:stop` | the development PostgreSQL on this machine |
| `npm run setup` | creates the tables and applies any new migrations |
| `npm run seed` | divisions, districts, sections, first accounts |
| `npm run migrate` | applies pending database changes on their server |
| `npm run images` | makes the 400/800/1400 copies for older photographs |
| `npm run export` | writes published stories out as files for the static site |

### The public read path

Open to anyone, published stories only:

```
GET /api/sections                 the 16 sections, with how many stories each holds
GET /api/stories?section=&page=   a page of published stories, newest first
GET /api/stories/<id>             one story in full, with related ones
GET /api/img/<id>?w=400|800|1400  a photograph at that width
```

Nothing that is a draft, awaiting review or sent back is reachable here, and no
staff detail appears in any response.

Then open **http://localhost:4000/office**

`db/seed.js` prints three starting accounts — one for each permission level —
and also writes them to `data/first-logins.txt`. The passwords are shown once.

To stop it, press Ctrl-C.

---

## Moving it to AMRUT's server

1. Copy this `server` folder onto the machine.
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — their PostgreSQL details. AMRUT confirmed on the call that
     all their databases are SQL/PostgreSQL, so this is the one to use in
     production.
   - `BASE_PATH` — where the office should sit in the address bar, for example
     `/office`.
   - `SECURE_COOKIES=1` once the site is served over https.
3. `npm install pg` (the only outside package, and only needed for PostgreSQL).
4. `node db/setup.js` to create the tables, then `node db/seed.js` for the
   divisions, districts, sections and the first head-office account.
5. `node src/server.js`, kept running by whatever the server already uses —
   systemd, pm2, or cPanel's Node.js App panel.
6. Put it behind the existing web server so `/office` reaches this port.

Nothing else changes. The same code runs on the file database here and on
PostgreSQL there.

### If their hosting cannot run Node.js

Ordinary PHP shared hosting often cannot. Ask their IT team two questions:
**does the hosting support Node.js, and which version?** and **can a PostgreSQL
database be created?** If the answer to the first is no, this needs either a
small separate server or a rewrite in PHP — worth knowing before session 2.

---

## Addresses — why they look the way they do

AMRUT asked that nobody be able to guess their way from one page to the next.
So no address ever contains `1`, `2`, `3`. Each row carries its own address:

```
/office/users/Xt-QGgImsHYGewqIU5zUBgIlhZ92
```

That is 16 random bytes followed by a 6-character checksum. The randomness is
what makes it unguessable; the checksum lets the server reject a mistyped or
invented address instantly, without touching the database. The checksum uses no
secret key on purpose — rotating a secret would otherwise break every address
already saved.

A page that does not exist and a page you are not allowed to open return
**exactly the same "not found" page**, so the office cannot be used to work out
what exists.

---

## Advertising (section B)

A district coordinator sells a placement in the field and records it; they then
record the money they took, with a reference; and the head office checks the
receipt before the advertisement goes live. It stops by itself when its days are
up. Exactly the flow the client described on the call.

Six placements are set up — popup on arrival, a slot in the hero rotation, a
full-width banner, one above the footer, a side banner, and one inside a story —
each sellable for 2, 7, 14 or 30 days.

> **The prices are placeholders.** The client's own rate chart sits with Hemant,
> and AMRUT's 13-15 lakh monthly viewership means the figures need raising.
> Replace them in `db/seed-ads.js` before anything is sold.

**On the payment gateway:** every mode of payment is recorded by hand today —
UPI, bank transfer, cheque, cash — which is how the coordinators actually
collect. A gateway slots into the same step (`mode` already allows `gateway`)
and nothing else changes. That work needs a merchant account and compliance
sign-off that we do not control, so it is not pretended to be done.

## Analytics (section C)

Every read is counted twice over: **all views** (what an advertiser is buying)
and **unique readers** (what AMRUT should plan with). The client asked for both
after the call, and both appear side by side everywhere.

No reader's address is stored. A visitor becomes a short hash made with a secret
that is replaced every day, so the same person counts once a day per story and
cannot be followed from one day to the next. That matters on a government portal
already carrying DPDP exposure on its survey form.

The dashboard at `/office/analytics` covers the **whole portal** — the 3,035
stories from the old site as well as anything written in the office — and filters
by period, district, section, and where a story came from. Whatever is on screen
downloads as CSV. Advertisements carry impressions, reach and clicks beside the
money collected.

## Finding your way around

```
server/
  src/
    core/        plumbing: settings, database, passwords, addresses, uploads
    shared/      the chrome around every office page
    modules/
      office/        signing in, home screen, account
      editorial/     stories: writing, review, publishing
      people/        the accounts that may use the office
      advertising/   placements, rate card, advertisements, payments
      analytics/     what is read, by whom, and what it earned
      publicapi/     the open read path at /api
    app.js       works out who is asking, hands over to the right module
  db/            schema, migrations, seeds, the export and image commands
  test/          one end-to-end check of the whole thing
```

**Every folder carries its own README** explaining what it owns, what the rules
are, and what is deliberately not built yet. Start at `src/modules/README.md`.

## Checking nothing is broken

```bash
npm start            # in one terminal
node test/smoke.js   # in another
```

It signs in as all three kinds of person, writes a story with a photograph, takes
it through review to publication, sells an advertisement, records the money, has
the head office confirm it — and then checks everything that must **not** be
possible: a draft reaching the public, a coordinator approving their own work, a
tampered address, an unpaid advertisement appearing on the portal. Run it after
any change.

## What is inside

```
server/
  .env.example      the settings file to copy and fill in
  src/
    server.js       starts it
    app.js          which address shows which page, and who may see it
    db.js           talks to SQLite or PostgreSQL - the only file that knows which
    auth.js         passwords, sign-in cookies, form protection
    ids.js          the unguessable addresses
    config.js       reads .env
    views/          the pages themselves
    public/         one stylesheet
  db/
    schema.sqlite.sql     the tables (file database)
    schema.postgres.sql   the same tables for PostgreSQL - keep the two in step
    setup.js              creates the tables
    seed.js               divisions, districts, sections, first accounts
  data/             the file database, uploads, logs (never committed)
```

### Dependencies

**One, in production: `pg`,** the PostgreSQL connector. Everything else is built
into Node — the web server, password hashing, reading photo uploads, even a
fallback database. That is deliberate: a government server often cannot reach
the internet to install packages, and a short dependency list is far easier to
get through a security review.

`embedded-postgres` is a *development* dependency — the throwaway PostgreSQL used
on a laptop. On AMRUT's server install without it:

```bash
npm install --omit=dev
```

---

## Security notes for the review

- Passwords are stored with scrypt and a per-password salt. Never in plain text.
- Sign-in cookies are signed; a tampered cookie is rejected without a database
  lookup. They are HttpOnly and SameSite=Lax, and Secure when `SECURE_COOKIES=1`.
- Every form carries a one-time field checked against a cookie, so another site
  cannot submit on a signed-in user's behalf.
- Sign-in is limited to 8 attempts per e-mail and address per 15 minutes.
- A wrong e-mail and a wrong password give the same message, so the office
  cannot be used to find out which e-mails exist.
- Every page carries `noindex`, so the office never appears in search results.
- Sign-ins, failures and sign-outs are written to the `audit_log` table, along
  with every story created, edited, submitted, approved, sent back or published.
- Uploaded photographs are accepted only if their first bytes really are a JPG,
  PNG or WEBP, so a renamed file cannot slip through. They are saved under an
  unguessable name, never the name the person uploaded, and are served through
  the office — a photograph attached to a Gondia story cannot be fetched by a
  coordinator in Pune. Limits: 12 MB a photograph, 8 a story, 40 MB a submission.

Still to do before it faces the public internet: change the starting passwords,
serve it over https with `SECURE_COOKIES=1`, and let the client's own security
audit have a look.

---

## A point to confirm with AMRUT

The brief said each divisional head covers **6 districts**. In practice the six
divisions hold 7, 5, 5, 8, 5 and 6. The seed uses the real figures. If AMRUT
groups them differently for their own purposes, say so and the seed changes.
