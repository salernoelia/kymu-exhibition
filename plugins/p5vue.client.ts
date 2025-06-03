// @ts-expect-error: Necessary to suppress type errors for p5vue compatibility
import p5vue from "p5vue"
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(p5vue)
})