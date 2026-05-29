<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import manifest from '../../research/manifest.json'

type ResearchItem = {
  title: string
  description?: string
  tags?: string[]
  category?: string
  type: string
  date: string
  href: string
  sourcePath: string
}

type PagefindResult = {
  id: string
  score: number
  data: () => Promise<{
    url: string
    meta: Record<string, string>
    excerpt: string
  }>
}

type SearchResult = {
  id: string
  url: string
  title: string
  excerpt: string
  type?: string
  date?: string
}

const query = ref('')
const activeType = ref('all')
const ready = ref(false)
const loading = ref(false)
const searchMessage = ref('索引加载中')
const searchResults = ref<SearchResult[]>([])
const items = manifest.items as ResearchItem[]
const itemsByHref = new Map(items.map((item) => [item.href, item]))
let pagefind: { search: (term: string) => Promise<{ results: PagefindResult[] }> } | null = null
let timer: number | undefined

onMounted(async () => {
  try {
    pagefind = await import(/* @vite-ignore */ withBase('/pagefind/pagefind.js'))
    ready.value = true
    searchMessage.value = ''
  } catch (error) {
    searchMessage.value = '搜索不可用，请先构建站点'
  }
})

const types = computed(() => {
  return ['all', ...Array.from(new Set(items.map((item) => item.type))).sort()]
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return items.filter((item) => {
    if (activeType.value !== 'all' && item.type !== activeType.value) return false
    if (!q) return true
    return [
      item.title,
      item.description,
      item.category,
      item.type,
      ...(item.tags || [])
    ].join(' ').toLowerCase().includes(q)
  })
})

function displayType(type?: string) {
  return type ? type.toUpperCase() : 'FILE'
}

function itemHref(item: ResearchItem) {
  return withBase(item.href.startsWith('/') ? item.href : `/${item.href}`)
}

function toHref(url: string) {
  if (/^https?:\/\//.test(url)) return url
  return withBase(url.startsWith('/') ? url : `/${url}`)
}

function manifestItemForUrl(url: string) {
  const pathname = url.startsWith('http') ? new URL(url).pathname : url.split(/[?#]/)[0]
  const researchIndex = pathname.indexOf('/research/')
  if (researchIndex === -1) return undefined
  return itemsByHref.get(pathname.slice(researchIndex))
}

function scheduleSearch() {
  window.clearTimeout(timer)
  timer = window.setTimeout(runSearch, 180)
}

async function runSearch() {
  const term = query.value.trim()
  if (!term) {
    searchResults.value = []
    searchMessage.value = ready.value ? '' : '索引加载中'
    return
  }
  if (!pagefind) return

  loading.value = true
  const response = await pagefind.search(term)
  const rows = await Promise.all(response.results.slice(0, 50).map(async (result) => {
    const data = await result.data()
    const item = manifestItemForUrl(data.url)
    return {
      id: result.id,
      url: toHref(data.url),
      title: item?.title || data.meta.title || data.url,
      excerpt: data.excerpt,
      type: item?.type || data.meta.type || data.meta.category,
      date: item?.date || data.meta.date
    }
  }))

  const filteredRows = rows.filter((result) => {
    return activeType.value === 'all' || result.type === activeType.value
  })
  searchResults.value = filteredRows.slice(0, 20)
  searchMessage.value = filteredRows.length ? `找到 ${filteredRows.length} 条结果` : '没有匹配结果'
  loading.value = false
}
</script>

<template>
  <section class="research-toolbar">
    <label class="research-search">
      <span>搜索</span>
      <input
        v-model="query"
        type="search"
        placeholder="搜索正文、标题或标签"
        :disabled="!ready"
        @input="scheduleSearch"
      />
    </label>
    <div class="research-types" aria-label="按类型筛选">
      <button
        v-for="type in types"
        :key="type"
        type="button"
        :class="{ active: activeType === type }"
        @click="activeType = type; scheduleSearch()"
      >
        {{ type === 'all' ? '全部' : type.toUpperCase() }}
      </button>
    </div>
  </section>

  <p class="research-count">{{ query.trim() ? (loading ? '全文搜索中' : searchMessage) : `共 ${filtered.length} 个成果` }}</p>

  <section class="search-results" v-if="query.trim() && searchResults.length">
    <a v-for="result in searchResults" :key="result.id" class="search-result" :href="result.url" target="_self">
      <div class="result-meta">
        <time v-if="result.date">{{ result.date }}</time>
        <span class="search-type">{{ displayType(result.type) }}</span>
      </div>
      <div class="result-main">
        <h2>{{ result.title }}</h2>
        <p v-html="result.excerpt"></p>
      </div>
    </a>
  </section>

  <section class="research-list" v-if="!query.trim() || !searchResults.length">
    <a
      v-for="item in filtered"
      :key="item.href"
      class="research-row"
      :href="itemHref(item)"
      target="_self"
    >
      <div class="research-row-meta">
        <time v-if="item.date">{{ item.date }}</time>
        <span class="research-type">{{ displayType(item.type) }}</span>
      </div>
      <div class="research-row-body">
        <div class="research-row-head">
          <h2>{{ item.title }}</h2>
          <span class="research-category">{{ item.category || 'Research' }}</span>
        </div>
        <p>{{ item.description || '无摘要。' }}</p>
        <div class="research-tags" v-if="item.tags?.length">
          <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
        </div>
      </div>
    </a>
  </section>
</template>
