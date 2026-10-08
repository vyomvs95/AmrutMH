'use strict'
/* The shell: signing in, the home screen, your own account, and the page shown
   when something is not there (or not yours). */
const { esc, page, bare, ROLE_MR, ROLE_EN, u } = require('../../shared/layout')

function signIn({ csrf, error, email = '' }) {
  return bare({
    title: 'प्रवेश',
    body: `<div class="signin"><div class="signin-box">
  <div class="mark"><b>अमृत महाराष्ट्र</b><span>कार्यालय प्रवेश · office sign in</span></div>
  <form class="box" method="post" action="${u('/login')}">
    ${error ? `<div class="err">${esc(error)}</div>` : ''}
    <input type="hidden" name="_csrf" value="${esc(csrf)}">
    <label for="email">ईमेल <em>· email</em></label>
    <input id="email" name="email" type="email" value="${esc(email)}" required autocomplete="username" autofocus>
    <label for="password">पासवर्ड <em>· password</em></label>
    <input id="password" name="password" type="password" required autocomplete="current-password">
    <button type="submit">प्रवेश करा</button>
  </form>
  <p style="text-align:center;color:var(--muted);font-size:.78rem;margin-top:1rem">
    पासवर्ड विसरलात? मुख्य कार्यालयाशी संपर्क साधा.</p>
</div></div>`,
  })
}

function dashboard({ user, counts, ads, scope }) {
  const tiles = [
    ['draft', 'मसुदे', 'Drafts'],
    ['submitted', 'तपासणीसाठी', 'Awaiting review'],
    ['published', 'प्रसिद्ध', 'Published'],
    ['returned', 'परत पाठवलेल्या', 'Returned'],
  ]
  return page({
    title: 'मुख्यपृष्ठ', user, active: '/dashboard',
    body: `
<div class="page-head">
  <h1>नमस्कार, ${esc(user.name)}</h1>
  <p>${ROLE_MR[user.role]} · ${ROLE_EN[user.role]}${scope ? ' — ' + esc(scope) : ''}</p>
</div>
<h2 style="font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:.6rem">बातम्या · stories</h2>
<div class="grid">
  ${tiles.map(([k, mr, en], i) => `<div class="stat ${i === 1 ? 'accent' : ''}">
    <b>${counts[k] ?? 0}</b><span>${mr} · ${en}</span></div>`).join('')}
</div>
${ads ? `<h2 style="font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:1.6rem 0 .6rem">जाहिराती · advertising</h2>
<div class="grid">
  <div class="stat"><b>${ads.live ?? 0}</b><span>सुरू असलेल्या · running now</span></div>
  <div class="stat accent"><b>${ads.awaiting ?? 0}</b><span>मंजुरीसाठी · awaiting approval</span></div>
  <div class="stat"><b>₹${Number(ads.earned || 0).toLocaleString('en-IN')}</b><span>जमा रक्कम · collected</span></div>
  ${user.role === 'district' ? `<div class="stat"><b>${ads.mine ?? 0}</b><span>माझ्या जाहिराती · mine</span></div>` : ''}
</div>` : ''}
<div class="card" style="margin-top:1.6rem">
  <h2>तुम्ही काय करू शकता · what your account can do</h2>
  ${{
    district: `<p>• तुमच्या जिल्ह्यातील बातम्या लिहिणे आणि तपासणीसाठी पाठवणे</p>
               <p>• जाहिरात नोंदवणे आणि तिचे पैसे जमा झाल्याची नोंद करणे</p>
               <p>• तुमच्या स्वतःच्या बातम्या पाहणे — इतर जिल्ह्यांच्या नाहीत</p>`,
    divisional: `<p>• तुमच्या विभागातील सहा जिल्ह्यांच्या बातम्या पाहणे</p>
                 <p>• त्या तपासून मुख्य कार्यालयाकडे पाठवणे किंवा परत पाठवणे</p>
                 <p>• विभागातील जाहिरातींची स्थिती पाहणे</p>`,
    editor: `<p>• राज्यभरातील सर्व बातम्या पाहणे</p>
             <p>• बातमी प्रसिद्ध करणे — हा अधिकार फक्त मुख्य कार्यालयाकडे आहे</p>
             <p>• जाहिरातीचे पैसे तपासून ती सुरू करणे</p>
             <p>• वापरकर्ते पाहणे</p>`,
  }[user.role]}
</div>`,
  })
}

function account({ user, row }) {
  return page({
    title: 'माझे खाते', user, active: '/account',
    body: `
<div class="page-head"><h1>माझे खाते</h1><p>Your account</p></div>
<div class="card">
  <p><b>नाव:</b> ${esc(row.name)}</p>
  <p><b>ईमेल:</b> ${esc(row.email)}</p>
  <p><b>अधिकार:</b> ${ROLE_MR[row.role]} · ${ROLE_EN[row.role]}</p>
  <p><b>ठिकाण:</b> ${esc(row.place || '—')}</p>
</div>
<p class="idline"><b>या खात्याचा पत्ता · this account's address</b>
  <span class="mono">${esc(row.public_id)}</span></p>
<div class="note">पासवर्ड बदलण्याची सुविधा अद्याप नाही.
<span style="display:block;color:var(--muted)">Changing your own password is not built yet.</span></div>`,
  })
}

function notFound() {
  return bare({
    title: 'सापडले नाही',
    body: `<div class="signin"><div class="signin-box" style="text-align:center">
      <h1 style="font-size:1.3rem;margin-bottom:.5rem">पृष्ठ सापडले नाही</h1>
      <p style="color:var(--muted);font-size:.9rem">This page does not exist, or is not yours to open.</p>
      <p style="margin-top:1.2rem"><a href="${u('/dashboard')}">कार्यालयाकडे परत →</a></p>
    </div></div>`,
  })
}

module.exports = { signIn, dashboard, account, notFound }
