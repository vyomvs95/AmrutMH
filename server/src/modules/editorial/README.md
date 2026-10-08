# editorial — stories

The whole life of a story: written by a district coordinator, checked by the
divisional head, published by the head office.

```
draft ──submit──► submitted ──approve──► approved ──publish──► published
  ▲                   │                      │
  └────── return ◄─────┴──────────────────────┘   (returned, with a reason)
```

- `scopeClause(user)` is the one place that decides which stories a person may
  see: their district, their division, or everything.
- `abilities(user, story)` decides which buttons appear. Every action re-checks
  it on the server; the buttons are only a hint.
- `savePhotos()` writes the original and asks `core/images` for the three WebP
  sizes.

Not built yet: deleting a story, captions or reordering photographs, and an
edit history.
