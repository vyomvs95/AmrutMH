'use strict'
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const config = require('../core/config')
const u = config.url

/* The stylesheet address carries a hash of the file, so a change is never cached. */
function styleVersion() {
  try {
    const file = path.join(__dirname, '..', 'public', 'office.css')
    const stat = fs.statSync(file)
    return crypto.createHash('sha1').update(`${stat.size}:${stat.mtimeMs}`).digest('hex').slice(0, 8)
  } catch { return 'dev' }
}

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const ROLE_MR = { district: 'जिल्हा समन्वयक', divisional: 'विभागीय प्रमुख', editor: 'संपादक' }
const ROLE_EN = { district: 'District coordinator', divisional: 'Divisional head', editor: 'Head office editor' }

const head = (title) => `<!doctype html>
<html lang="mr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="google" content="notranslate">
<title>${esc(title)} — अमृत कार्यालय</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Marathi&family=Mukta:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${u('/style.css')}?v=${styleVersion()}">
</head><body>`

function nav(user, active) {
  const items = [
    ['/dashboard', 'मुख्यपृष्ठ', 'Home', true],
    ['/stories', 'बातम्या', 'Stories', true],
    ['/review', 'तपासणीसाठी', 'Review', user.role !== 'district'],
    ['/ads', 'जाहिराती', 'Advertising', true],
    ['/analytics', 'आकडेवारी', 'Analytics', true],
    ['/ticker', 'बातमीपट्टी', 'Ticker', user.role === 'editor'],
    ['/users', 'वापरकर्ते', 'People', user.role === 'editor'],
    ['/account', 'माझे खाते', 'Account', true],
  ].filter((i) => i[3])
  return `<nav class="nav"><div class="nav-in">${items.map(([href, mr, en]) =>
    `<a href="${u(href)}" class="${active === href ? 'on' : ''}">${mr} <span style="color:var(--muted);font-size:.78em">${en}</span></a>`
  ).join('')}</div></nav>`
}

function page({ title, user, active, body }) {
  return head(title) + `
<header class="top"><div class="top-in">
  <div class="brand"><b>अमृत महाराष्ट्र</b><span>कार्यालय · back office</span></div>
  <div class="spacer"></div>
  <div class="who"><b>${esc(user.name)}</b><span>${ROLE_MR[user.role]}${user.place ? ' · ' + esc(user.place) : ''}</span></div>
  <form method="post" action="${u('/logout')}" style="width:auto">
    <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
    <button class="linkbtn" type="submit">बाहेर पडा</button>
  </form>
</div></header>
${nav(user, active)}
<main>${body}</main>
<footer>अमृत महाराष्ट्र — महाराष्ट्र संशोधन, उन्नती व प्रशिक्षण प्रबोधिनी · हे पृष्ठ फक्त अधिकृत वापरासाठी आहे.</footer>
</body></html>`
}

function bare({ title, body }) {
  return head(title) + body + '</body></html>'
}

module.exports = { esc, page, bare, ROLE_MR, ROLE_EN, u }
