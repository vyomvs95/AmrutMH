'use strict'
/* Who may use the office. Read-only for now: accounts are made by the seed
   script. An add/edit screen is the next thing this module needs. */
const { esc, page, ROLE_MR, ROLE_EN, u } = require('../../shared/layout')
const T = require('../../shared/table')

function list({ user, rows, sort, url }) {
  return page({
    title: 'वापरकर्ते', user, active: '/users',
    body: `
<div class="page-head" id="list"><h1>वापरकर्ते</h1><p>${rows.length} accounts — the three permission levels</p></div>
${T.dataTable({
  url, prefix: 'u_', state: sort, rows,
  cols: [
    { head: 'नाव · name', key: 'name', cell: (r) => `<a href="${u('/users/' + r.public_id)}">${esc(r.name)}</a>` },
    { head: 'ईमेल', key: 'email', cell: (r) => `<span class="mono">${esc(r.email)}</span>` },
    { head: 'अधिकार · role', key: 'role', cell: (r) => `<span class="tag ${r.role}">${ROLE_MR[r.role]}</span>` },
    { head: 'ठिकाण', key: 'place', cell: (r) => esc(r.place || '—') },
  ],
})}
<div class="note">प्रत्येक दुव्यात अंदाज न बांधता येणारा पत्ता आहे — क्रमांक नाही.
<span style="display:block;color:var(--muted)">Every link carries an unguessable address, never a number in sequence.</span></div>`,
  })
}

function detail({ user, row }) {
  return page({
    title: esc(row.name), user, active: '/users',
    body: `
<p class="backlink"><a href="${u('/users')}">← यादीकडे परत</a></p>
<div class="page-head"><h1>${esc(row.name)}</h1><p>${ROLE_EN[row.role]}</p></div>
<div class="card">
  <p><b>ईमेल:</b> ${esc(row.email)}</p>
  <p><b>दूरध्वनी:</b> ${esc(row.phone || '—')}</p>
  <p><b>अधिकार:</b> ${ROLE_MR[row.role]}</p>
  <p><b>ठिकाण:</b> ${esc(row.place || '—')}</p>
  <p><b>स्थिती:</b> ${row.is_active ? 'कार्यरत' : 'बंद'}</p>
  <p><b>शेवटचा प्रवेश:</b> ${esc(row.last_login_at || 'अद्याप नाही')}</p>
</div>
<p class="idline"><b>या खात्याचा पत्ता · this account's address</b>
  <span class="mono">${esc(row.public_id)}</span></p>`,
  })
}

module.exports = { list, detail }
