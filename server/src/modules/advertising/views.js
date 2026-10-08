'use strict'
const { esc, page, u } = require('../../shared/layout')
const T = require('../../shared/table')

const STATUS = {
  draft:     ['मसुदा', 'Draft'],
  submitted: ['पैसे तपासणीसाठी', 'Payment awaiting check'],
  live:      ['सुरू', 'Running'],
  rejected:  ['नाकारली', 'Rejected'],
  ended:     ['संपली', 'Ended'],
}
const tag = (s) => `<span class="tag st-${s === 'live' ? 'published' : s === 'rejected' ? 'returned' : s}">${(STATUS[s] || [s])[0]}</span>`
const rupees = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

function list({ user, rows, sort, url, scope }) {
  return page({
    title: 'जाहिराती', user, active: '/ads',
    body: `
<div class="page-head" id="list"><h1>जाहिराती</h1><p>Advertising${scope ? ' — ' + esc(scope) : ''}</p></div>
${user.role === 'district' ? `<p><a href="${u('/ads/new')}" class="cta">+ नवीन जाहिरात नोंदवा · record an advertisement</a></p>` : ''}
<p style="margin:-.4rem 0 1rem"><a href="${u('/ads/rates')}">दरपत्रक पहा · see the rate card</a></p>
${rows.length === 0 ? `<div class="empty"><b>अजून एकही जाहिरात नाही</b>
  ${user.role === 'district' ? 'क्षेत्रात जाहिरात मिळाल्यावर ती इथे नोंदवा.' : 'जिल्ह्यांतून जाहिराती आल्यावर त्या इथे दिसतील.'}</div>`
: T.dataTable({
    url, prefix: 'a_', state: sort, rows, anchor: 'list',
    cols: [
      { head: 'जाहिरातदार · advertiser', key: 'advertiser', cell: (r) => `<a href="${u('/ads/' + r.public_id)}">${esc(r.advertiser_name)}</a>` },
      { head: 'जागा', key: 'slot', cell: (r) => esc(r.slot_mr) },
      { head: 'जिल्हा', key: 'district', cell: (r) => esc(r.district_mr || '—') },
      { head: 'रक्कम', key: 'amount', num: true, cell: (r) => rupees(r.amount_inr) },
      { head: 'स्थिती', key: 'status', cell: (r) => tag(r.status) },
      { head: 'कालावधी', key: 'updated', cell: (r) => `<span class="mono" style="font-size:.72rem">${r.starts_on ? esc(String(r.starts_on).slice(0, 10)) + ' → ' + esc(String(r.ends_on).slice(0, 10)) : r.days + ' दिवस'}</span>` },
    ],
  })}`,
  })
}

function rates({ user, slots }) {
  return page({
    title: 'दरपत्रक', user, active: '/ads',
    body: `
<p class="backlink"><a href="${u('/ads')}">← जाहिरातींकडे परत</a></p>
<div class="page-head"><h1>दरपत्रक</h1><p>Rate card — what each placement costs, by number of days</p></div>
<div class="note"><b>हे दर तात्पुरते आहेत.</b> हेमंत यांच्याकडील दरपत्रक आल्यावर ते बदलायचे आहेत.
<span style="display:block;color:var(--muted)">These figures are placeholders. The client's own rate chart replaces them before anything is sold —
AMRUT's 13-15 lakh monthly viewership means they will need raising.</span></div>
<table><thead><tr><th>जागा · placement</th><th>आकार</th><th>२ दिवस</th><th>७ दिवस</th><th>१४ दिवस</th><th>३० दिवस</th></tr></thead>
<tbody>${slots.map((s) => `<tr>
  <td><b>${esc(s.name_mr)}</b><br><span style="color:var(--muted);font-size:.8rem">${esc(s.note_mr || '')}</span></td>
  <td class="mono" style="font-size:.75rem">${s.width_px}×${s.height_px}</td>
  ${[2, 7, 14, 30].map((d) => `<td>${rupees((s.rates.find((r) => r.days === d) || {}).amount_inr)}</td>`).join('')}
</tr>`).join('')}</tbody></table>
`,
  })
}

function form({ user, slots, ad = {}, error }) {
  return page({
    title: 'नवीन जाहिरात', user, active: '/ads',
    body: `
<p class="backlink"><a href="${u('/ads')}">← जाहिरातींकडे परत</a></p>
<div class="page-head"><h1>नवीन जाहिरात</h1><p>Record an advertisement you have sold</p></div>
${error ? `<div class="err">${esc(error)}</div>` : ''}
<form class="card" method="post" enctype="multipart/form-data" action="${u('/ads/new')}">
  <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
  <label for="advertiser_name">जाहिरातदाराचे नाव <em>· advertiser</em></label>
  <input id="advertiser_name" name="advertiser_name" type="text" required maxlength="200" value="${esc(ad.advertiser_name || '')}">

  <label for="advertiser_contact">संपर्क <em>· phone or e-mail</em></label>
  <input id="advertiser_contact" name="advertiser_contact" type="text" maxlength="120" value="${esc(ad.advertiser_contact || '')}">

  <label for="slot_id">जागा <em>· placement</em></label>
  <select id="slot_id" name="slot_id" required>
    <option value="">— निवडा —</option>
    ${slots.map((s) => `<option value="${s.id}" ${String(ad.slot_id) === String(s.id) ? 'selected' : ''}>${esc(s.name_mr)} (${s.width_px}×${s.height_px})</option>`).join('')}
  </select>

  <label for="days">कालावधी <em>· for how many days</em></label>
  <select id="days" name="days" required>
    ${[2, 7, 14, 30].map((d) => `<option value="${d}" ${String(ad.days) === String(d) ? 'selected' : ''}>${d} दिवस</option>`).join('')}
  </select>

  <label for="target_url">जोडलेला दुवा <em>· where it should link (optional)</em></label>
  <input id="target_url" name="target_url" type="text" maxlength="400" value="${esc(ad.target_url || '')}">

  <label for="creative">जाहिरातीची प्रतिमा <em>· the artwork — JPG, PNG or WEBP</em></label>
  <input id="creative" name="creative" type="file" accept="image/jpeg,image/png,image/webp">

  <button type="submit">जतन करा · save</button>
</form>
<div class="note">रक्कम दरपत्रकातून आपोआप घेतली जाते. पैसे जमा झाल्यावर पुढच्या पानावर त्याची नोंद करा.
<span style="display:block;color:var(--muted)">The amount comes from the rate card. Record the money on the next screen once you have taken it.</span></div>`,
  })
}

function view({ user, ad, payments, can }) {
  const act = (path, label, en, extra = '', style = '') => `
    <form method="post" action="${u('/ads/' + ad.public_id + '/' + path)}" style="width:auto;display:inline-block;margin:0 .4rem .4rem 0">
      <input type="hidden" name="_csrf" value="${esc(user.csrf)}">${extra}
      <button type="submit" style="width:auto;padding:.5rem .9rem;${style}">${label}
        <em style="font-style:normal;opacity:.75;font-size:.85em">${en}</em></button>
    </form>`
  const paid = payments.reduce((n, p) => n + Number(p.amount_inr), 0)
  return page({
    title: ad.advertiser_name, user, active: '/ads',
    body: `
<p class="backlink"><a href="${u('/ads')}">← जाहिरातींकडे परत</a></p>
<div class="page-head">
  <h1>${esc(ad.advertiser_name)}</h1>
  <p>${tag(ad.status)} · ${esc(ad.slot_mr)} · ${esc(ad.district_mr || '—')} · ${rupees(ad.amount_inr)} / ${ad.days} दिवस</p>
</div>
${ad.review_note ? `<div class="err"><b>शेरा:</b> ${esc(ad.review_note)}</div>` : ''}
<div class="card">
  <p><b>संपर्क:</b> ${esc(ad.advertiser_contact || '—')}</p>
  <p><b>दुवा:</b> ${ad.target_url ? esc(ad.target_url) : '—'}</p>
  <p><b>कालावधी:</b> ${ad.starts_on ? esc(String(ad.starts_on).slice(0, 10)) + ' ते ' + esc(String(ad.ends_on).slice(0, 10)) : ad.days + ' दिवस (सुरू झाल्यापासून)'}</p>
  <p><b>नोंदवली:</b> ${esc(ad.created_by_name || '—')}</p>
</div>
${ad.image_public_id ? `<div class="thumbs"><figure><img src="${u('/ads/img/' + ad.image_public_id)}" alt=""></figure></div>` : ''}
<div class="card">
  <h2>पैसे · money</h2>
  ${payments.length === 0 ? '<p style="color:var(--muted)">अजून कोणतीही नोंद नाही.</p>'
    : `<table><thead><tr><th>रक्कम</th><th>प्रकार</th><th>संदर्भ</th><th>दिनांक</th><th>तपासले</th></tr></thead>
       <tbody>${payments.map((p) => `<tr><td>${rupees(p.amount_inr)}</td><td>${esc(p.mode)}</td>
         <td class="mono">${esc(p.reference || '—')}</td><td>${esc(String(p.received_on || '').slice(0, 10))}</td>
         <td>${p.confirmed_at ? '✓ ' + esc(p.confirmed_by_name || '') : '—'}</td></tr>`).join('')}</tbody></table>
       <p style="margin-top:.6rem"><b>एकूण जमा:</b> ${rupees(paid)} / ${rupees(ad.amount_inr)}</p>`}
  ${can.recordPayment ? `
  <form method="post" action="${u('/ads/' + ad.public_id + '/payment')}" style="margin-top:1rem">
    <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
    <label for="amount">जमा झालेली रक्कम <em>· amount taken</em></label>
    <input id="amount" name="amount" type="text" inputmode="numeric" required value="${ad.amount_inr}">
    <label for="mode">कसे मिळाले <em>· how</em></label>
    <select id="mode" name="mode" required>
      <option value="upi">UPI</option><option value="neft">NEFT / bank transfer</option>
      <option value="cheque">धनादेश · cheque</option><option value="cash">रोख · cash</option>
      <option value="gateway">संकेतस्थळावरून · payment gateway</option>
    </select>
    <label for="reference">संदर्भ क्रमांक <em>· reference / receipt number</em></label>
    <input id="reference" name="reference" type="text" maxlength="120">
    <button type="submit">नोंद करा आणि तपासणीसाठी पाठवा · record and send for checking</button>
  </form>` : ''}
</div>
<div class="card">
  <h2>पुढे काय · what happens next</h2>
  <div>
    ${can.confirm ? act('confirm', 'पैसे तपासले — जाहिरात सुरू करा', 'confirm payment and start', '', 'background:var(--ok)') : ''}
    ${can.reject ? act('reject', 'नाकारा', 'reject',
        '<input type="text" name="note" placeholder="कारण · reason" style="width:220px;display:inline-block;margin:0 .3rem 0 0">') : ''}
    ${can.stop ? act('stop', 'थांबवा', 'stop now') : ''}
  </div>
  ${!can.confirm && !can.reject && !can.stop && !can.recordPayment
    ? '<p style="color:var(--muted);font-size:.9rem">सध्या तुमच्यासाठी कोणतीही कृती नाही.</p>' : ''}
</div>
<p class="idline"><b>या जाहिरातीचा पत्ता · this advertisement's address</b>
  <span class="mono">${esc(ad.public_id)}</span></p>`,
  })
}

module.exports = { list, rates, form, view, STATUS }
