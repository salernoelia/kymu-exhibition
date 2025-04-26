// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  css: [
    "~/assets/css/main.css",
    "~/assets/css/reset.css",
    "~/assets/css/tailwind.css",
  ],

  imports: {
    dirs: ["~/shared/types/*.d.ts", "~/shared/utils/*.ts", "~/assets/*.json"],
  },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxt/fonts",
    "@nuxt/icon",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@nuxt/eslint",
  ],

  pinia: {
    storesDirs: ["./stores/**"],
  },

  compatibilityDate: "2025-04-26",
});
