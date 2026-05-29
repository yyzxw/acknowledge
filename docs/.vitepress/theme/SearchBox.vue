<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

type PagefindResult = {
  id: string
  score: number
  data: () => Promise<{
    url: string
    meta: Record<string, string>
    excerpt: string
    filters?: Record<string, string[]>
  }>
}

type SearchResult = {
  id: string
  url: string
  title: string
  excerpt: string
  type?: string
}

const ready = ref(false)
const loading = ref(false)
const message = ref('搜索索引加载中')
const query = ref('')
const results = ref<SearchResult[]>([])
let pagefind: { search: (term: string) => Promise<{ results: PagefindResult[] }> } | null = null
let timer: number | undefined

onMounted(async () => {
  try {
    pagefind = await import(/* @vite-ignore */ withBase('pagefind/pagefind.js'))
    ready.value = true
    message.value = '输入关键词开始搜索'
  } catch (error) {
    message.value = '搜索索引还没有生成，请先运行 npm run docs:build'
  }
})

function toHref(url: string) {
  if (/^https?:\/\//.test(url)) return url
  return withBase(url.startsWith('/') ? url : `/${url}`)
}

function scheduleSearch() {
  window.clearTimeout(timer)
  timer = window.setTimeout(runSearch, 180)
}

async function runSearch() {
  const term = query.value.trim()
  if (!term) {
    results.value = []
    message.value = ready.value ? '输入关键词开始搜索' : '搜索索引加载中'
    return
  }
  if (!pagefind) return

  loading.value = true
  const response = await pagefind.search(term)
  const rows = await Promise.all(response.results.slice(0, 20).map(async (result) => {
    const data = await result.data()
    return {
      id: result.id,
      url: toHref(data.url),
      title: data.meta.title || data.url,
      excerpt: data.excerpt,
      type: data.meta.type || data.meta.category
    }
  }))
  results.value = rows
  message.value = rows.length ? `找到 ${rows.length} 条结果` : '没有匹配结果'
  loading.value = false
}
</script>

<template>
  <section class="search-panel">
    <div class="search-input-wrap">
      <input
        v-model="query"
        type="search"
        placeholder="搜索 HTML 正文、Markdown 页面和成果元信息"
        :disabled="!ready"
        @input="scheduleSearch"
      />
    </div>
    <p class="search-status">{{ loading ? '搜索中' : message }}</p>
    <div class="search-results" v-if="results.length">
      <a v-for="result in results" :key="result.id" class="search-result" :href="result.url" target="_self">
        <div>
          <span v-if="result.type" class="search-type">{{ result.type }}</span>
          <h2>{{ result.title }}</h2>
        </div>
        <p v-html="result.excerpt"></p>
      </a>
    </div>
  </section>
</template>
