// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: false },
    ssr: false,
    // electron: {
    //     build: [
    //       {

    //         entry: 'electron/main.ts',
    //       },
    //     ],
    //   },
    css: ['~/assets/css/main.css', '~/assets/css/reset.css', '~/assets/css/tailwind.css'],

    imports: {
        dirs: ['~/shared/types/*.d.ts', '~/shared/utils/*.ts', '~/assets/*.json'],
    },

    modules: [
      '@nuxtjs/tailwindcss',
      '@nuxt/fonts',
      '@nuxt/icon',
      '@pinia/nuxt',
      '@vueuse/nuxt',
      '@nuxt/eslint',
      'motion-v/nuxt',
      'nuxt-mcp',
      //'nuxt-electron',
    ],

    pinia: {
        storesDirs: ['./stores/**'],
    },

    app: {
        pageTransition: { name: 'page', mode: 'out-in' },
    },

    compatibilityDate: '2025-05-17',
});