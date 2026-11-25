import en from "~/i18n-en.json";

// Arabic is the source language: the Arabic text itself is the key. English comes from i18n-en.json.
// A missing English entry falls back to the Arabic text. Changing the language reloads the page so every
// label, constant and direction is rebuilt in one consistent pass.
export function useI18n() {
  const lang = useCookie<string>("ghiyar-lang", { default: () => "ar", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", path: "/" });
  const locale = computed(() => (lang.value === "en" ? "en" : "ar"));
  const dir = computed(() => (locale.value === "en" ? "ltr" : "rtl"));
  function t(key: string, ...args: any[]) {
    let s: string = locale.value === "en" ? ((en as Record<string, string>)[key] ?? key) : key;
    args.forEach((a, i) => { s = s.split("{" + i + "}").join(String(a)); });
    return s;
  }
  function setLocale(l: "ar" | "en") {
    lang.value = l;
    if (import.meta.client) location.reload();
  }
  return { t, locale, dir, setLocale };
}
