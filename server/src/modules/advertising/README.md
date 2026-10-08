# advertising — placements, money, and what runs on the portal

The flow the client described on the call:

```
district coordinator sells a placement and records it      → draft
records the money taken, with a reference                   → submitted
head office checks the receipt and starts it                → live
                                                            → rejected (with a reason)
its last day passes, or the head office stops it            → ended
```

- `ad_slots` is the catalogue of places an advertisement can appear, with its
  pixel size. `ad_rates` is the price for each placement and duration (2, 7, 14
  and 30 days).
- **The prices in `db/seed-ads.js` are placeholders.** The client's own rate
  chart sits with Hemant, and their 13–15 lakh monthly viewership means the
  figures need raising. Replace them before anything is sold.
- `ad_payments` records every rupee: how much, how it arrived, its reference,
  who took it and who checked it. An advertisement only runs once the head
  office has confirmed the receipt.
- **A payment gateway plugs in at the `payment` step.** `mode` already allows
  `gateway`; every other mode is recorded by hand, which is how the coordinators
  collect today. Nothing else has to change when AMRUT has a merchant account.
- `expireOld()` runs on every visit to this module and stops anything whose last
  day has passed, so nothing keeps running by accident.

Not built yet: editing the rate card from the screen, per-coordinator targets,
and counting how often an advertisement was seen.
