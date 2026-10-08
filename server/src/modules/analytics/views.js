'use strict'
const { esc, page, u } = require('../../shared/layout')
const config = require('../../core/config')
const T = require('../../shared/table')

/* A story's own URL as a reader sees it, when we know where the portal lives.
   The portal builds a story address from its section, its id and a slug made
   from the headline. */
const slugOf = (title) => String(title || '').trim()
  .replace(/[|/\\?#%.,!'"\u201c\u201d\u2018\u2019;:()\[\]]/g, '')
  .replace(/\s+/g, '-').slice(0, 60).replace(/-+$/, '')

const readerLink = (r) =>
  config.portalUrl && r.catSlug ? `${config.portalUrl}/${r.catSlug}/${r.id}/${slugOf(r.title)}` : null

/* The small picture beside a headline. Office stories keep theirs here;
   archive stories still have theirs on the old site. */
const thumbOf = (r) =>
  r.officeImage ? u('/img/' + r.officeImage + '?w=400')
  : (r.archiveImage && config.archiveImages ? config.archiveImages + String(r.archiveImage).replace(/^\/+/, '') : null)

const n = (x) => Number(x || 0).toLocaleString('en-IN')
const rupees = (x) => '₹' + n(x)
const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + '%' : '—')

function bars(days) {
  if (!days.length) return '<p class="muted-note">या कालावधीत वाचन नोंदलेले नाही.</p>'
  const max = Math.max(...days.map((d) => d.views), 1)
  const perReader = (d) => (d.uniques ? (d.views / d.uniques).toFixed(1) : '—')
  return `<div class="spark">${days.map((d) => `
    <div class="spark-col">
      <div class="spark-bar" style="height:${Math.max(2, (d.views / max) * 100)}%">
        <div class="spark-uniq" style="height:${d.views ? (d.uniques / d.views) * 100 : 0}%"></div>
      </div>
      <div class="spark-tip" role="tooltip">
        <b>${esc(d.day)}</b>
        <span><i class="sw sw-views"></i>एकूण वाचन<em>${n(d.views)}</em></span>
        <span><i class="sw sw-uniq"></i>वेगवेगळे वाचक<em>${n(d.uniques)}</em></span>
        <span><i class="sw sw-none"></i>प्रति वाचक<em>${perReader(d)}</em></span>
      </div>
    </div>`).join('')}</div>
  <div class="spark-axis"><span>${esc(days[0].day)}</span><span>${esc(days[days.length - 1].day)}</span></div>`
}

function panel(title, { url, prefix, state, cols, rows, empty, after = '', id = '', search = '' }) {
  return `<div class="card"${id ? ` id="${id}"` : ''}>
  <div class="panel-head"><h2>${title}</h2>${search}</div>
  ${T.dataTable({ url, prefix, state, cols, rows, empty, anchor: id })}${after}</div>`
}

function dashboard({ user, f, url, sorts, districts, sections, totals, published, days, byDistrict, bySection, top, ads, money }) {
  const opt = (list, sel, label) => list.map((x) =>
    `<option value="${x.id}" ${String(sel) === String(x.id) ? 'selected' : ''}>${esc(x[label])}</option>`).join('')
  const periodLink = (d, text) =>
    `<a class="chip ${f.days === d ? 'on' : ''}" href="${u('/analytics?days=' + d + (f.district ? '&district=' + f.district : '') + (f.section ? '&section=' + f.section : '') + (f.source ? '&source=' + f.source : ''))}">${text}</a>`

  return page({
    title: 'आकडेवारी', user, active: '/analytics',
    body: `
<div class="page-head">
  <h1>आकडेवारी</h1>
  <p>Analytics — ${esc(f.from)} ते ${esc(f.to)}${user.place ? ' · ' + esc(user.place) : ''}</p>
</div>

<div class="filters">
  <div class="chips">${periodLink(7, '७ दिवस')}${periodLink(30, '३० दिवस')}${periodLink(90, '९० दिवस')}${periodLink(365, 'वर्षभर')}</div>
  <form method="get" action="${u('/analytics')}" class="filter-form">
    <input type="hidden" name="days" value="${esc(f.days)}">
    ${user.role === 'editor' ? `<select name="district"><option value="">सर्व जिल्हे · all districts</option>${opt(districts, f.district, 'name_mr')}</select>` : ''}
    <select name="section"><option value="">सर्व विभाग · all sections</option>${opt(sections, f.section, 'name_mr')}</select>
    <select name="source">
      <option value="">सर्व बातम्या · everything</option>
      <option value="office" ${f.source === 'office' ? 'selected' : ''}>कार्यालयातून लिहिलेल्या · written here</option>
      <option value="archive" ${f.source === 'archive' ? 'selected' : ''}>जुन्या संकेतस्थळावरून · from the archive</option>
    </select>
    <button type="submit">लागू करा · apply</button>
    ${(f.district || f.section || f.source) ? `<a href="${u('/analytics?days=' + f.days)}" style="font-size:.85rem">साफ करा</a>` : ''}
  </form>
</div>

<div class="grid">
  <div class="stat accent"><b>${n(totals.views)}</b><span>एकूण वाचन · all views<br><em>जाहिरातदारांसाठीचा आकडा</em></span></div>
  <div class="stat"><b>${n(totals.uniques)}</b><span>वेगवेगळे वाचक · unique readers<br><em>नियोजनासाठीचा आकडा</em></span></div>
  <div class="stat"><b>${totals.views ? (totals.views / Math.max(totals.uniques, 1)).toFixed(1) : '0'}</b><span>प्रति वाचक वाचन · views per reader</span></div>
  <div class="stat"><b>${n(published)}</b><span>या काळात प्रसिद्ध · published in this period</span></div>
</div>

<div class="card">
  <h2>दिवसागणिक · day by day</h2>
  <p style="font-size:.82rem;color:var(--muted);margin-top:-.3rem">
    उंच पट्टी म्हणजे एकूण वाचन; आतला गडद भाग म्हणजे वेगवेगळे वाचक.
    <span style="display:block">Full bar is all views; the darker part inside is unique readers.</span></p>
  ${bars(days)}
</div>

${panel('जिल्ह्यानुसार · by district', {
  id: 'by-district', url, prefix: 'd_', state: sorts.district, rows: byDistrict,
  empty: 'या कालावधीत कोणत्याही जिल्ह्याचे वाचन नोंदलेले नाही.',
  cols: [
    { head: 'जिल्हा', key: 'name', cell: (r) => esc(r.name) },
    { head: 'वाचन', key: 'views', num: true, cell: (r) => n(r.views) },
    { head: 'वाचक', key: 'uniques', num: true, cell: (r) => n(r.uniques) },
    { head: 'बातम्या', key: 'stories', num: true, cell: (r) => n(r.stories) },
  ],
})}

${panel('विभागानुसार · by section', {
  id: 'by-section', url, prefix: 's_', state: sorts.section, rows: bySection,
  empty: 'या कालावधीत कोणत्याही विभागाचे वाचन नोंदलेले नाही.',
  cols: [
    { head: 'विभाग', key: 'name', cell: (r) => esc(r.name) },
    { head: 'वाचन', key: 'views', num: true, cell: (r) => n(r.views) },
    { head: 'वाचक', key: 'uniques', num: true, cell: (r) => n(r.uniques) },
    { head: 'बातम्या', key: 'stories', num: true, cell: (r) => n(r.stories) },
  ],
})}

${panel('सर्वाधिक वाचलेल्या बातम्या · most read', {
  id: 'most-read', url, prefix: 't_', state: sorts.story, rows: top.rows,
  search: (() => {
    const keep = new URLSearchParams(url.search); keep.delete('q'); keep.delete('t_page')
    return `<form class="tablesearch" method="get" action="${u('/analytics')}#most-read">
      ${[...keep].map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')}
      <input type="search" name="q" value="${esc(f.q || '')}" placeholder="बातमी शोधा · search a headline">
      <button type="submit">शोधा · search</button>
      ${f.q ? `<a href="${u('/analytics?' + keep.toString())}#most-read">साफ करा</a>` : ''}
    </form>` })(),
  empty: f.q ? 'या शोधाशी जुळणारी बातमी सापडली नाही.' : 'या कालावधीत कोणतीही बातमी वाचली गेलेली नाही.',
  after: T.pager(url, 't_', top.page, top.pages, top.total, 'most-read'),
  cols: [
    { head: 'शीर्षक', key: 'title', cell: (r) => {
        const thumb = thumbOf(r)
        return `<div class="rowstory">
          ${thumb ? `<img class="thumb" src="${thumb}" alt="" loading="lazy">` : '<span class="thumb thumb-none" aria-hidden="true"></span>'}
          <span><b>${esc(r.title)}</b><br>
            <span style="color:var(--muted);font-size:.78rem">${esc(r.district)} · ${esc(r.section)}${r.source === 'archive' ? ' · जुन्या संकेतस्थळावरून' : ''}</span>
          </span></div>` } },
    { head: 'वाचन', key: 'views', num: true, cell: (r) => n(r.views) },
    { head: 'वाचक', key: 'uniques', num: true, cell: (r) => n(r.uniques) },
    { head: '', cell: (r) => {
        const links = []
        if (r.source === 'office') links.push(`<a href="${u('/stories/' + r.id)}">कार्यालयात उघडा</a>`)
        const reader = readerLink(r)
        if (reader) links.push(`<a href="${esc(reader)}" target="_blank" rel="noopener">बातमी पहा ↗</a>`)
        return links.length ? `<span class="rowlinks">${links.join('')}</span>` : '' } },
  ],
})}

<div class="card" id="ads">
  <h2>जाहिराती · advertising</h2>
  <div class="grid" style="margin-bottom:1rem">
    <div class="stat"><b>${rupees(money)}</b><span>या काळात जमा · collected</span></div>
    <div class="stat"><b>${n(ads.reduce((s, a) => s + a.shown, 0))}</b><span>जाहिरात दर्शने · impressions</span></div>
    <div class="stat"><b>${n(ads.reduce((s, a) => s + a.clicks, 0))}</b><span>क्लिक · clicks</span></div>
  </div>
  ${T.dataTable({
    url, prefix: 'a_', state: sorts.ad, rows: ads, anchor: 'ads',
    empty: 'या काळात कोणतीही जाहिरात दाखवली गेली नाही.',
    cols: [
      { head: 'जाहिरातदार', key: 'advertiser', cell: (a) => esc(a.advertiser) },
      { head: 'जागा', key: 'slot', cell: (a) => esc(a.slot || '—') },
      { head: 'दर्शने', key: 'shown', num: true, cell: (a) => n(a.shown) },
      { head: 'पोहोच', key: 'reach', num: true, cell: (a) => n(a.reach) },
      { head: 'क्लिक', key: 'clicks', num: true, cell: (a) => n(a.clicks) },
      { head: 'दर', num: true, cell: (a) => pct(a.clicks, a.shown) },
    ],
  })}
</div>

<div class="note">
  वाचकाचा पत्ता साठवला जात नाही. दररोज बदलणाऱ्या गुप्त किल्लीने बनवलेला संक्षिप्त ठसा वापरला जातो,
  त्यामुळे एकच वाचक दोन दिवस जोडता येत नाही.
  <span style="display:block;color:var(--muted)">No reader's address is stored. A visitor becomes a short hash made with a
  secret that is replaced every day, so the same reader cannot be joined up across days.</span>
</div>

<p style="font-size:.82rem;color:var(--muted)">
  <a href="${u('/analytics.csv?' + new URLSearchParams({ days: f.days, district: f.district || '', section: f.section || '', source: f.source || '' }))}">
  ही आकडेवारी CSV मध्ये उतरवा · download this as CSV</a></p>`,
  })
}

module.exports = { dashboard }
