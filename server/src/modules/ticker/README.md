# ticker — the scrolling band under the navigation

Six lines of news or scheme links that run round and round beneath the portal's
section navigation, each divided by a bar. **Head office only** — a coordinator
or a divisional head gets the same "not found" as anyone not allowed in.

- `/office/ticker` shows the band **exactly as the portal renders it**, then the
  six lines beneath it. One line is edited at a time; the rest stay as a list.
- Reorder by dragging a line, or with the ↑ ↓ buttons. The buttons do the same
  work on the server, so nothing is lost if the dragging script does not run.
- A line carries text, a link and whether it is shown. A link must be either a
  path inside the portal (`/govet-schemes`) or a full web address — anything
  else is dropped, so a line can never carry a `javascript:` link.
- Every change is written to `audit_log`.

The portal reads the lines from `GET /api/ticker` when it can reach the office,
and otherwise from `public/data/ticker.json`, which `npm run export` writes. With
neither, the band does not render at all.
