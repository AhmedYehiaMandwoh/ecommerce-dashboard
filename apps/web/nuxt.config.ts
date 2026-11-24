import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  modules: ["shadcn-nuxt"],
  shadcn: { prefix: "", componentDir: "./app/components/ui" },
  vite: { plugins: [tailwindcss() as any] },
  compatibilityDate: "2026-11-24",
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:4000/api",
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: "ar", dir: "rtl" },
      title: "غيار | سوق قطع الغيار",
      meta: [
        {
          name: "description",
          content: "نسخة تطوير تجريبية لسوق قطع غيار متعدد المتاجر",
        },
      ],
    },
  },
  css: ["~/assets/css/tailwind.css"],
});
