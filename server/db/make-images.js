'use strict'
/* Makes the 400/800/1400 WebP copies for photographs uploaded before the resizer existed.. */
const db = require('../src/core/db')
const images = require('../src/core/images')

;(async () => {
  await db.connect()
  if (!images.available()) {
    console.log('The "sharp" package is not installed, so no resizing is possible.')
    console.log('Install it with:  npm install sharp')
    await db.close(); return
  }
  const rows = await db.all("SELECT id, file_path, widths FROM story_images WHERE widths IS NULL OR widths = '' OR img_w IS NULL")
  console.log(`${rows.length} photograph(s) to do`)
  for (const r of rows) {
    try {
      const made = await images.makeVariants(r.file_path)
      await db.run('UPDATE story_images SET widths = ?, img_w = ?, img_h = ? WHERE id = ?',
        [made.widths.join(','), made.width, made.height, r.id])
      console.log('  ', r.file_path, '->', made.widths.join(', ') || 'none', made.width ? `(${made.width}x${made.height})` : '')
    } catch (e) { console.error('  ', r.file_path, 'failed:', e.message) }
  }
  await db.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
