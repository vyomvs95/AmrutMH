# publicapi — what the portal may read

Open to anyone, **published and running things only**. No sign-in, and no staff
detail in any reply.

```
GET /api/sections                 the 16 sections, with counts
GET /api/stories?section=&page=   published stories, newest first
GET /api/stories/<id>             one story in full
GET /api/img/<id>?w=              a story photograph
GET /api/ads?slot=                advertisements running right now
GET /api/ads/img/<id>?w=          the artwork of a running advertisement
```

Every query here filters on `status`. A draft, a story in review, an unpaid
advertisement and a finished one all return "not found" — the smoke test checks
each of those, because this is the file where a mistake would be public.
