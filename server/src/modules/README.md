# modules — one folder per part of the office

Each module owns its own routes and its own screens, and answers only for the
addresses it recognises. `src/app.js` works out who is asking and then offers
the request to each module in turn.

| folder | owns | addresses |
|---|---|---|
| `office/` | signing in and out, the home screen, your own account | `/login` `/logout` `/dashboard` `/account` |
| `editorial/` | writing a story, review, publishing, story photographs | `/stories…` `/review` `/img/…` |
| `people/` | the accounts that may use the office | `/users…` |
| `advertising/` | placements, the rate card, advertisements, payments | `/ads…` |
| `publicapi/` | the open read path the portal uses | `/api/…` |

A module exports `handle(ctx)` and returns `true` once it has answered. Some
also export `summary(user)`, which is what the home screen's figures come from.

To add a module: make the folder, write `routes.js` and `views.js`, add it to
the list in `src/app.js`, and add its tab in `src/shared/layout.js`.
