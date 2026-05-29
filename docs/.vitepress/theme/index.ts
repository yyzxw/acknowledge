import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ReportList from './ReportList.vue'
import SearchBox from './SearchBox.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ReportList', ReportList)
    app.component('SearchBox', SearchBox)
  }
} satisfies Theme
