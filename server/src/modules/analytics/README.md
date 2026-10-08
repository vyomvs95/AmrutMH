# analytics — what is read, by whom, and what it earned

## Two numbers, always

| | means | who it is for |
|---|---|---|
| **views** | every read; the same person counted again on a later visit | advertisers — this is what they are buying |
| **uniques** | how many different people | AMRUT — this is what to plan with |

The client settled on impressions alone during the call, then asked for both.
Both are now kept, side by side, everywhere.

## How a reader is counted without being identified

`core/visitor.js` reduces a request to a short hash of its address, browser and
language, mixed with a secret **that is replaced every day**. No address, browser
string or identifier is ever stored. Two consequences, both wanted:

- the same person counts once a day per story, so *uniques* means something;
- tomorrow their hash is different, so nobody — including us — can follow a
  reader across days.

A refresh within a minute does not inflate *views* either (`counter.js`).

## What is counted

- **Office stories**, by their address, and **archive stories**, by their old
  number — so the whole portal is measured, not just the new part. Titles for
  the 3,035 archive stories come from `db/seed-legacy.js`.
- **Advertisements**: shown (impressions), reach, and clicks.

`view_daily` holds the totals per subject per day; `view_seen` holds one row per
reader per subject per day and is only needed to work out *uniques*.
`counter.forget()` deletes rows older than 40 days.

## The dashboard

`/office/analytics`, scoped the same way as everything else: a coordinator sees
their district, a divisional head their division, the head office everything.

Filters: period (7/30/90/365 days), district, section, and whether a story was
written in the office or came from the archive. Everything on screen downloads
as CSV from the same filters.

Shows: all views, unique readers, views per reader, published in the period, a
day-by-day bar for each, by district, by section, the most-read stories, and the
advertising figures with money collected.

## Not built yet

Scheduled e-mail reports, comparison against the previous period, reading time
or scroll depth, and where readers came from (search, WhatsApp, direct) — that
last one needs a referrer, which is worth a privacy decision before adding.
