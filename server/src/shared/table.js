'use strict'
/* Sortable column headings, shared by every table that shows data.
 *
 * A heading is a link that carries the sort back in the address, so sorting
 * survives a refresh, can be bookmarked, and needs no JavaScript — which also
 * means it works on the cheap Android phones this portal is built for.
 *
 * Clicking a new column sorts the sensible way first: largest first for a
 * number, A-to-Z (in Marathi order) for a name. Clicking the same column again
 * turns it around.
 */

const { esc } = require('./layout')

const ARROW = { asc: '↑', desc: '↓' }

/* Read "<prefix>sort" and "<prefix>dir" out of the address, keeping them to
   what this table actually allows. */
function readSort(url, prefix, allowed, fallbackKey, fallbackDir = 'desc') {
  const key = url.searchParams.get(prefix + 'sort')
  const dir = url.searchParams.get(prefix + 'dir')
  return {
    key: allowed.includes(key) ? key : fallbackKey,
    dir: dir === 'asc' || dir === 'desc' ? dir : fallbackDir,
  }
}

/* The address this heading should link to. */
function sortHref(url, prefix, col, state, anchor = '') {
  const p = new URLSearchParams(url.search)
  const firstDir = col.num ? 'desc' : 'asc'
  const dir = state.key === col.key ? (state.dir === 'asc' ? 'desc' : 'asc') : firstDir
  p.set(prefix + 'sort', col.key)
  p.set(prefix + 'dir', dir)
  /* The anchor is what stops the browser jumping to the top of the page:
     it lands back on this table instead. */
  return url.pathname + '?' + p.toString() + (anchor ? '#' + anchor : '')
}

function heading(url, prefix, col, state, anchor) {
  const align = col.num ? ' style="text-align:right"' : ''
  if (!col.key) return `<th${align}>${col.head || ''}</th>`
  const on = state.key === col.key
  return `<th${align}><a class="sortable${on ? ' on' : ''}" href="${esc(sortHref(url, prefix, col, state, anchor))}"
    >${col.head}<span class="caret">${on ? ARROW[state.dir] : '↕'}</span></a></th>`
}

/* cols: [{ head, key?, num?, cell(row) }] */
function dataTable({ url, prefix, state, cols, rows, empty, anchor = '' }) {
  if (!rows.length) return `<p class="muted-note">${esc(empty || 'काहीही नाही')}</p>`
  return `<table class="sorted"><thead><tr>${cols.map((c) => heading(url, prefix, c, state, anchor)).join('')}</tr></thead>
  <tbody>${rows.map((r) => `<tr>${cols.map((c) =>
    `<td${c.num ? ' style="text-align:right"' : ''}>${c.cell(r)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
}

/* first / previous / page x of y / next / last */
function pager(url, prefix, page, pages, total, anchor = '') {
  if (pages <= 1) return `<p class="pager-note">${total} पैकी ${total} दाखवले</p>`
  const to = (n) => {
    const p = new URLSearchParams(url.search)
    p.set(prefix + 'page', n)
    return url.pathname + '?' + p.toString() + (anchor ? '#' + anchor : '')
  }
  const step = (n, label, enabled) => enabled
    ? `<a href="${esc(to(n))}">${label}</a>`
    : `<span class="off">${label}</span>`
  return `<div class="pager">
    ${step(1, '« पहिले', page > 1)}
    ${step(page - 1, '‹ मागील', page > 1)}
    <span class="where">पान ${page} / ${pages} · एकूण ${total}</span>
    ${step(page + 1, 'पुढील १० ›', page < pages)}
  </div>`
}

module.exports = { readSort, sortHref, dataTable, pager }
