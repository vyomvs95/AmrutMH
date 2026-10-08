# core — the plumbing

Shared by every module. Nothing here knows about stories or advertisements.

| file | what it is |
|---|---|
| `config.js` | reads `.env`; the only file that knows where things live |
| `db.js` | PostgreSQL or the fallback file database, behind one small interface |
| `auth.js` | passwords (scrypt), the sign-in cookie, form protection |
| `ids.js` | the unguessable public addresses |
| `http.js` | sending a reply, reading a form, writing to the audit record |
| `upload.js` | reading a form that carries photographs |
| `images.js` | the 400/800/1400 WebP copies |

Change something here and every module feels it — so this is the part to be
careful with.
