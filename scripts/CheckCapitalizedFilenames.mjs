// node scripts/CheckCapitalizedFilenames.mjs
/* To rename logger.js to Logger.js:
git mv app/src/logger.js app/src/__tmp_logger__.js
git mv app/src/__tmp_logger__.js app/src/Logger.js
*/
import fs from 'node:fs/promises'
import path from 'node:path'

const roots = ['app/src', 'api/src']
const allowedExt = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'])

const ignoreBaseNames = new Set([
  'index', 'main' // optional: keep if you allow index.js
])

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const out = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...await walk(full))
      continue
    }

    const ext = path.extname(entry.name)
    if (!allowedExt.has(ext)) continue

    const base = path.basename(entry.name, ext)
    if (ignoreBaseNames.has(base)) continue

    if (!/^[A-Z]/.test(base)) {
      out.push(full)
    }
  }

  return out
}

const warnings = []
for (const root of roots) {
  try {
    warnings.push(...await walk(root))
  } catch {
    // ignore missing directories
  }
}

if (warnings.length) {
  console.warn('\n[filename-case] Warnings:')
  for (const file of warnings) {
    console.warn(` - ${file}`)
  }
  console.warn('\nExpected file basename to start with a capital letter.')
} else {
  console.log('[filename-case] OK')
}

// keep as warning-only:
process.exit(0)