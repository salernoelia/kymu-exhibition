// p5vue.client.ts

import { defineNuxtPlugin } from "#app"
//@ts-ignore
import p5vue from "p5vue"
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(p5vue)
})