// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ["~/assets/css/main.css", "~/assets/css/reset.css"],

  imports: {
    dirs: ["~/shared/types/*.d.ts", "~/shared/utils/*.ts", "~/assets/*.json"],
  },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],

  pinia: {
    storesDirs: ["./stores/**"],
  },

  compatibilityDate: "2025-04-26",
});