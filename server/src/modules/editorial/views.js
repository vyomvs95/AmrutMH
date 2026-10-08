'use strict'
const { esc, page, u } = require('../../shared/layout')
const T = require('../../shared/table')

const STATUS = {
  draft:     ['मसुदा', 'Draft'],
  submitted: ['तपासणीसाठी', 'Awaiting review'],
  approved:  ['मंजूर', 'Approved'],
  published: ['प्रसिद्ध', 'Published'],
  returned:  ['परत पाठवले', 'Returned'],
}
const tag = (s) => `<span class="tag st-${s}">${(STATUS[s] || [s])[0]}</span>`

/* ---------- write / edit ---------- */
function form({ user, story = {}, sections, error, photos = [] }) {
  const isNew = !story.public_id
  return page({
    title: isNew ? 'नवीन बातमी' : 'बातमी संपादन', user, active: '/stories',
    body: `
<p class="backlink"><a href="${u('/stories')}">← बातम्यांकडे परत</a></p>
<div class="page-head">
  <h1>${isNew ? 'नवीन बातमी' : 'बातमी संपादन'}</h1>
  <p>${isNew ? 'New story' : 'Edit story'}${story.district_mr ? ' — ' + esc(story.district_mr) : ''}</p>
</div>
${error ? `<div class="err">${esc(error)}</div>` : ''}
<form class="card" method="post" enctype="multipart/form-data"
      action="${u(isNew ? '/stories/new' : '/stories/' + story.public_id + '/edit')}">
  <input type="hidden" name="_csrf" value="${esc(user.csrf)}">

  <label for="title">शीर्षक <em>· headline</em></label>
  <input id="title" name="title" type="text" required maxlength="300" value="${esc(story.title || '')}">

  <label for="section_id">विभाग <em>· section — where it appears on the portal</em></label>
  <select id="section_id" name="section_id" required>
    <option value="">— निवडा —</option>
    ${sections.map((s) => `<option value="${s.id}" ${String(story.section_id) === String(s.id) ? 'selected' : ''}>${esc(s.name_mr)}</option>`).join('')}
  </select>

  <label for="body">बातमी <em>· the story itself</em></label>
  <textarea id="body" name="body" rows="14" required>${esc(story.body || '')}</textarea>

  <label for="photos">छायाचित्रे <em>· photographs — JPG, PNG or WEBP, up to 8</em></label>
  <input id="photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple>

  ${photos.length ? `<div class="thumbs">${photos.map((p) =>
    `<figure><img src="${u('/img/' + p.public_id)}" alt=""></figure>`).join('')}</div>` : ''}

  <button type="submit">जतन करा · save</button>
</form>`,
  })
}

/* ---------- read one ---------- */
function view({ user, story, photos, can }) {
  const act = (path, label, en, style = '') => `
    <form method="post" action="${u('/stories/' + story.public_id + '/' + path)}" style="width:auto;display:inline-block;margin:0 .4rem .4rem 0">
      <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
      ${path === 'return' ? '<input type="text" name="note" placeholder="कारण · reason" style="width:220px;display:inline-block;margin:0 .3rem 0 0">' : ''}
      <button type="submit" style="width:auto;padding:.5rem .9rem;${style}">${label} <em style="font-style:normal;opacity:.75;font-size:.85em">${en}</em></button>
    </form>`
  return page({
    title: story.title, user, active: '/stories',
    body: `
<p class="backlink"><a href="${u('/stories')}">← बातम्यांकडे परत</a></p>
<div class="page-head">
  <h1>${esc(story.title)}</h1>
  <p>${tag(story.status)} · ${esc(story.district_mr || '—')} · ${esc(story.section_mr || '—')}
     · ${esc(story.author_name || '')}</p>
</div>
${story.review_note ? `<div class="err"><b>परत पाठवले:</b> ${esc(story.review_note)}</div>` : ''}
<div class="card"><div class="story-body">${esc(story.body).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>').replace(/^/, '<p>').replace(/$/, '</p>')}</div></div>
${photos.length ? `<div class="thumbs">${photos.map((p) =>
  `<figure><img src="${u('/img/' + p.public_id)}" alt=""></figure>`).join('')}</div>` : ''}
<div class="card">
  <h2>पुढे काय · what happens next</h2>
  ${can.edit ? `<a href="${u('/stories/' + story.public_id + '/edit')}" style="display:inline-block;margin:.2rem .6rem .6rem 0">संपादन करा · edit</a>` : ''}
  <div style="margin-top:.5rem">
    ${can.submit ? act('submit', 'तपासणीसाठी पाठवा', 'send for review') : ''}
    ${can.approve ? act('approve', 'मंजूर करा', 'approve') : ''}
    ${can.return ? act('return', 'परत पाठवा', 'send back') : ''}
    ${can.publish ? act('publish', 'प्रसिद्ध करा', 'publish', 'background:var(--ok)') : ''}
  </div>
  ${!can.submit && !can.approve && !can.return && !can.publish && !can.edit
    ? '<p style="color:var(--muted);font-size:.9rem">या बातमीवर तुमच्यासाठी सध्या कोणतीही कृती नाही.</p>' : ''}
</div>
<p class="idline"><b>या बातमीचा पत्ता · this story's address</b>
  <span class="mono">${esc(story.public_id)}</span></p>`,
  })
}

/* ---------- lists ---------- */
function list({ user, rows, total, page: pageNo, pages, url, sort, q, scope, heading, blurb, empty }) {
  const keep = new URLSearchParams(url.search); keep.delete('q'); keep.delete('t_page')
  const here = heading === 'तपासणीसाठी' ? '/review' : '/stories'
  return page({
    title: heading, user, active: here,
    body: `
<div class="page-head">
  <h1>${heading}</h1><p>${blurb}${scope ? ' — ' + esc(scope) : ''}</p>
</div>
<div class="toolbar" id="list">
  ${user.role === 'district' && here === '/stories'
    ? `<a href="${u('/stories/new')}" class="cta">+ नवीन बातमी लिहा · write a story</a>` : '<span></span>'}
  <form class="tablesearch" method="get" action="${u(here)}#list">
    ${[...keep].map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')}
    <input type="search" name="q" value="${esc(q || '')}" placeholder="शीर्षकात शोधा · search a headline">
    <button type="submit">शोधा · search</button>
    ${q ? `<a href="${u(here + '?' + keep.toString())}#list">साफ करा</a>` : ''}
  </form>
</div>
${rows.length === 0
  ? `<div class="empty"><b>${esc(q ? 'या शोधाशी जुळणारी बातमी नाही' : empty[0])}</b>${esc(q ? '' : empty[1])}</div>`
  : T.dataTable({
      url, prefix: 't_', state: sort, rows, anchor: 'list',
      cols: [
        { head: 'शीर्षक · title', key: 'title', cell: (r) => `<a href="${u('/stories/' + r.public_id)}">${esc(r.title)}</a>` },
        { head: 'जिल्हा', key: 'district', cell: (r) => esc(r.district_mr || '—') },
        { head: 'विभाग', key: 'section', cell: (r) => esc(r.section_mr || '—') },
        { head: 'स्थिती', key: 'status', cell: (r) => tag(r.status) },
        { head: 'बदल', key: 'updated', cell: (r) => `<span class="mono" style="font-size:.72rem">${esc(String(r.updated_at || '').slice(0, 10))}</span>` },
      ],
    })}
${rows.length ? T.pager(url, 't_', pageNo, pages, total, 'list') : ''}`,
  })
}

module.exports = { form, view, list, STATUS }
