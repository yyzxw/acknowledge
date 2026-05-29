import fs from 'node:fs/promises'
import path from 'node:path'
import * as pagefind from 'pagefind'
import manifest from '../docs/research/manifest.json' with { type: 'json' }

const root = process.cwd()
const distDir = path.join(root, 'docs/.vitepress/dist')
const publicResearchDir = path.join(root, 'docs/public/research')
const distResearchDir = path.join(distDir, 'research')
const compatResearchDir = path.join(distResearchDir, 'research')
const outputPath = path.join(distDir, 'pagefind')
const textExtensions = new Set(['.md', '.txt', '.json', '.csv', '.xml', '.yml', '.yaml'])

function textForItem(item) {
  const pieces = [
    item.title,
    item.description,
    item.date,
    item.category,
    item.type,
    ...(item.tags || [])
  ]
  return pieces.filter(Boolean).join('\n')
}

async function readExtractableText(item) {
  const ext = path.extname(item.sourcePath).toLowerCase()
  if (!textExtensions.has(ext)) return ''
  const absPath = path.join(publicResearchDir, item.sourcePath)
  return fs.readFile(absPath, 'utf8').catch(() => '')
}

async function writeResearchCompatCopies() {
  await fs.rm(compatResearchDir, { recursive: true, force: true })
  await fs.mkdir(compatResearchDir, { recursive: true })

  const entries = await fs.readdir(distResearchDir, { withFileTypes: true })
  await Promise.all(entries.map((entry) => {
    if (entry.name === 'research') return undefined
    return fs.cp(
      path.join(distResearchDir, entry.name),
      path.join(compatResearchDir, entry.name),
      { recursive: true }
    )
  }))
}

const { index } = await pagefind.createIndex({
  rootSelector: 'html',
  excludeSelectors: ['nav', '.VPNav', '.VPSidebar', '.VPDocAside', 'script', 'style'],
  forceLanguage: 'zh',
  verbose: false
})

const { errors } = await index.addDirectory({
  path: distDir,
  glob: '**/*.html'
})

if (errors?.length) {
  for (const error of errors) console.warn(error)
}

for (const item of manifest.items) {
  if (item.type === 'html' || item.sourcePath.endsWith('/index.html')) continue
  const extracted = await readExtractableText(item)
  await index.addCustomRecord({
    url: item.href,
    content: `${textForItem(item)}\n${extracted}`.trim(),
    language: 'zh',
    meta: {
      title: item.title,
      date: item.date,
      category: item.category || item.type,
      type: item.type
    },
    filters: {
      type: [item.type],
      category: [item.category || item.type]
    }
  })
}

await index.writeFiles({ outputPath })
await pagefind.close()
console.log(`Wrote Pagefind index to ${path.relative(root, outputPath)}`)

await writeResearchCompatCopies()
console.log(`Wrote research compatibility copies to ${path.relative(root, compatResearchDir)}`)
