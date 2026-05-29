import { defineConfig } from 'vitepress'

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base = process.env.GITHUB_ACTIONS && repo ? `/${repo}/` : '/'

export default defineConfig({
  title: 'Acknowledge',
  description: '研究成果与技术文档',
  lang: 'zh-CN',
  base,
  srcExclude: ['public/**'],
  cleanUrls: true,
  ignoreDeadLinks: true,
  head: [
    [
      'script',
      {},
      "if (location.pathname.includes('/research/research/')) location.replace(location.pathname.replace('/research/research/', '/research/') + location.search + location.hash);"
    ]
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '研究成果', link: '/research/' }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/yyzxw/acknowledge' }
    ],
    outline: {
      label: '本页目录'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    darkModeSwitchLabel: '外观',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部'
  }
})
