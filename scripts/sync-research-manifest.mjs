import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const publicResearchDir = path.join(root, 'docs/public/research')
const manifestPath = path.join(root, 'docs/research/manifest.json')

const ignoredNames = new Set(['.DS_Store', 'Agent.md'])
const ignoredDirs = new Set(['images', 'assets', 'research'])
const textExtensions = new Set(['.html', '.htm', '.md', '.txt', '.json', '.csv', '.xml', '.yml', '.yaml'])

function normalizeSlash(value) {
  return value.split(path.sep).join('/')
}

function titleFromSlug(slug) {
  return slug
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function stripHtml(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function meta(html, name) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i')
  return decodeHtmlEntities(html.match(re)?.[1]?.trim() || '')
}

function metaByAttr(html, attr, name) {
  const re = new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i')
  return decodeHtmlEntities(html.match(re)?.[1]?.trim() || '')
}

function titleFromHtml(html) {
  return meta(html, 'page-title') || decodeHtmlEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '')
}

function normalizeDate(value) {
  const text = value?.trim()
  if (!text) return ''

  const iso = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`

  const zh = text.match(/\b(20\d{2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?\b/)
  if (zh) return `${zh[1]}-${zh[2].padStart(2, '0')}-${zh[3].padStart(2, '0')}`

  return ''
}

function dateFromHtml(html) {
  const candidates = [
    meta(html, 'page-date'),
    meta(html, 'date'),
    meta(html, 'publish-date'),
    meta(html, 'published'),
    meta(html, 'created'),
    meta(html, 'updated'),
    metaByAttr(html, 'property', 'article:published_time'),
    metaByAttr(html, 'property', 'article:modified_time'),
    html.match(/<time[^>]+datetime=["']([^"']+)["']/i)?.[1] || '',
    html.match(/(?:研究日期|报告日期|发布日期|生成日期|更新时间|日期)\s*[:：]\s*([^<|\n]+)/i)?.[1] || ''
  ]

  for (const candidate of candidates) {
    const date = normalizeDate(candidate)
    if (date) return date
  }

  return ''
}

function dateFromMarkdown(markdown) {
  const frontmatterDate = markdown.match(/^---[\s\S]*?\ndate:\s*["']?([^"'\n]+)["']?[\s\S]*?---/)?.[1] || ''
  return normalizeDate(frontmatterDate)
}

async function metadataForFile(absPath, relPath) {
  const ext = path.extname(absPath).toLowerCase()
  const sourcePath = normalizeSlash(relPath)
  const href = `/research/${sourcePath}`
  const base = {
    title: titleFromSlug(path.basename(sourcePath)),
    description: '',
    tags: [],
    category: ext.slice(1).toUpperCase() || 'File',
    type: ext.slice(1).toLowerCase() || 'file',
    date: '',
    href,
    sourcePath
  }

  if (!textExtensions.has(ext)) return base

  const raw = await fs.readFile(absPath, 'utf8').catch(() => '')
  if (!raw) return base

  if (ext === '.html' || ext === '.htm') {
    const keywords = meta(raw, 'keywords')
    const description = meta(raw, 'description')
    return {
      ...base,
      title: titleFromHtml(raw) || base.title,
      description: description || stripHtml(raw).slice(0, 140),
      tags: keywords ? keywords.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      category: meta(raw, 'page-category') || base.category,
      date: dateFromHtml(raw)
    }
  }

  if (ext === '.md') {
    const heading = raw.match(/^#\s+(.+)$/m)?.[1]?.trim()
    const text = raw.replace(/^---[\s\S]*?---/, '').replace(/^#+\s+/gm, '')
    return {
      ...base,
      title: heading || base.title,
      description: text.replace(/\s+/g, ' ').trim().slice(0, 140),
      category: 'Markdown',
      date: dateFromMarkdown(raw)
    }
  }

  return {
    ...base,
    description: raw.replace(/\s+/g, ' ').trim().slice(0, 140)
  }
}

async function collectEntries(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  const items = []

  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) continue
    const absPath = path.join(dir, entry.name)
    const relPath = path.join(prefix, entry.name)

    if (entry.isDirectory()) {
      if (!prefix && ignoredDirs.has(entry.name)) continue
      const indexPath = path.join(absPath, 'index.html')
      if (await fs.stat(indexPath).then(() => true).catch(() => false)) {
        items.push(await metadataForFile(indexPath, path.join(relPath, 'index.html')))
        continue
      }
      items.push(...await collectEntries(absPath, relPath))
      continue
    }

    if (entry.isFile()) {
      items.push(await metadataForFile(absPath, relPath))
    }
  }

  return items
}

const items = (await collectEntries(publicResearchDir))
  .sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate) return byDate
    return a.title.localeCompare(b.title, 'zh-CN')
  })

await fs.mkdir(path.dirname(manifestPath), { recursive: true })
await fs.writeFile(manifestPath, `${JSON.stringify({ items }, null, 2)}\n`)
console.log(`Wrote ${items.length} research entries to ${normalizeSlash(path.relative(root, manifestPath))}`)
