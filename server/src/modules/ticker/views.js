'use strict'
const { esc, page, u } = require('../../shared/layout')

/* Exactly what the band looks like on the portal, so nothing is edited blind. */
function preview(items) {
  const live = items.filter((i) => i.is_active)
  return `<div class="tick-preview">
    <div class="tick-strip">${live.length
      ? live.map((i) => `<span class="tick-item">${esc(i.text_mr)}</span>`).join('<span class="tick-sep">|</span>')
      : '<span class="tick-item" style="opacity:.7">— एकही ओळ सुरू नाही —</span>'}</div>
  </div>`
}

function list({ user, items, editing, saved }) {
  const row = (it, index) => {
    const isEditing = editing === it.public_id
    if (isEditing) {
      return `<li class="tick-row editing">
        <form method="post" action="${u('/ticker/' + it.public_id + '/save')}">
          <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
          <label for="t${index}">ओळ <em>· the words that scroll</em></label>
          <input id="t${index}" name="text_mr" type="text" required maxlength="160" value="${esc(it.text_mr)}" autofocus>
          <label for="l${index}">दुवा <em>· where it should go — a scheme, a section, or a full address</em></label>
          <input id="l${index}" name="link_url" type="text" maxlength="400" value="${esc(it.link_url || '')}"
                 placeholder="/govet-schemes  किंवा  https://mahaamrut.org.in">
          <label class="tick-check"><input type="checkbox" name="is_active" value="1" ${it.is_active ? 'checked' : ''}>
            ही ओळ पट्टीत दाखवा <em>· show this line</em></label>
          <div class="tick-actions">
            <button type="submit">जतन करा · save</button>
            <a href="${u('/ticker')}">रद्द करा · cancel</a>
          </div>
        </form>
      </li>`
    }
    return `<li class="tick-row" draggable="true" data-id="${esc(it.public_id)}">
      <span class="tick-grip" title="ओढून क्रम बदला">⠿</span>
      <span class="tick-no">${index + 1}</span>
      <span class="tick-text">
        <b${it.is_active ? '' : ' style="opacity:.45"'}>${esc(it.text_mr)}</b>
        <span class="tick-link">${it.link_url ? esc(it.link_url) : '— दुवा नाही —'}</span>
      </span>
      ${it.is_active ? '' : '<span class="tag">बंद</span>'}
      <span class="tick-move">
        <form method="post" action="${u('/ticker/reorder')}"><input type="hidden" name="_csrf" value="${esc(user.csrf)}">
          <input type="hidden" name="move" value="${esc(it.public_id)}"><input type="hidden" name="dir" value="up">
          <button type="submit" title="वर">↑</button></form>
        <form method="post" action="${u('/ticker/reorder')}"><input type="hidden" name="_csrf" value="${esc(user.csrf)}">
          <input type="hidden" name="move" value="${esc(it.public_id)}"><input type="hidden" name="dir" value="down">
          <button type="submit" title="खाली">↓</button></form>
      </span>
      <a class="tick-edit" href="${u('/ticker?edit=' + it.public_id)}">संपादन · edit</a>
    </li>`
  }

  return page({
    title: 'बातमीपट्टी', user, active: '/ticker',
    body: `
<div class="page-head">
  <h1>बातमीपट्टी</h1>
  <p>The scrolling band under the navigation — six lines, shown in this order</p>
</div>
${saved ? '<div class="note" style="border-left-color:var(--ok)">बदल जतन झाला.<span style="display:block;color:var(--muted)">Saved — the portal picks it up straight away.</span></div>' : ''}

<div class="card">
  <h2>पोर्टलवर असे दिसेल · exactly how it appears</h2>
  ${preview(items)}
  <p style="font-size:.8rem;color:var(--muted);margin-top:.6rem">
    पट्टी सतत फिरत राहते आणि प्रत्येक ओळ | ने वेगळी केली जाते.
    <span style="display:block">The band runs continuously and each line is divided by a bar.</span></p>
</div>

<div class="card">
  <h2>ओळी · the lines</h2>
  <p style="font-size:.82rem;color:var(--muted);margin-top:-.4rem">
    एका वेळी एकच ओळ संपादित करता येते. क्रम बदलण्यासाठी ओळ ओढा, किंवा ↑ ↓ वापरा.
    <span style="display:block">One line at a time. Drag a line to reorder it, or use the arrows.</span></p>
  <ol class="tick-list" id="ticklist">${items.map(row).join('')}</ol>
  <form method="post" action="${u('/ticker/reorder')}" id="orderform" style="display:none">
    <input type="hidden" name="_csrf" value="${esc(user.csrf)}">
    <input type="hidden" name="order" id="orderfield">
  </form>
</div>

<div class="note">ही पट्टी फक्त मुख्य कार्यालय बदलू शकते.
<span style="display:block;color:var(--muted)">Only the head office can change this band.</span></div>

<script>
/* Dragging to reorder. The arrows above do the same thing without any
   scripting, so nothing is lost if this does not run. */
(function () {
  var list = document.getElementById('ticklist')
  if (!list) return
  var dragged = null
  list.addEventListener('dragstart', function (e) {
    var li = e.target.closest('li[draggable]'); if (!li) return
    dragged = li; li.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
  })
  list.addEventListener('dragend', function () {
    if (!dragged) return
    dragged.classList.remove('dragging'); dragged = null
    var ids = [].slice.call(list.querySelectorAll('li[data-id]')).map(function (n) { return n.dataset.id })
    document.getElementById('orderfield').value = ids.join(',')
    document.getElementById('orderform').submit()
  })
  list.addEventListener('dragover', function (e) {
    e.preventDefault(); if (!dragged) return
    var over = e.target.closest('li[draggable]'); if (!over || over === dragged) return
    var box = over.getBoundingClientRect()
    var after = (e.clientY - box.top) / box.height > 0.5
    list.insertBefore(dragged, after ? over.nextSibling : over)
  })
})()
</script>`,
  })
}

module.exports = { list, preview }
