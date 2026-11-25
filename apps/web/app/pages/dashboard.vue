<script setup lang="ts">
const { t, locale, setLocale } = useI18n();
import { Bell, ClipboardList, Home, Package, Store, MoreHorizontal, LogOut, ShieldCheck, RefreshCw, Menu, Boxes, Upload, Wallet, Undo2, Truck, Headset, Banknote, BookOpen, PackagePlus } from "lucide-vue-next";
const { dash, dashboard, user, logout, error, message, busy } = useMarket();
const route = useRoute();
const admin = computed(() => user.value?.role === "ADMIN");
const nav = computed(() =>
  admin.value
    ? [
        { to: "/dashboard", label: t('نظرة عامة'), icon: Home },
        { to: "/dashboard/applications", label: t('المحلات'), icon: Store },
        { to: "/dashboard/orders", label: t('الطلبات'), icon: ClipboardList },
        { to: "/dashboard/review", label: t('المراجعة'), icon: ShieldCheck },
        { to: "/dashboard/more", label: t('المزيد'), icon: MoreHorizontal },
      ]
    : [
        { to: "/dashboard", label: t('الرئيسية'), icon: Home },
        { to: "/dashboard/orders", label: t('الطلبات'), icon: ClipboardList },
        { to: "/dashboard/inventory", label: t('المنتجات'), icon: Package },
        { to: "/dashboard/add-product", label: t('إضافة منتج'), icon: Store },
        { to: "/dashboard/more", label: t('المزيد'), icon: MoreHorizontal },
      ],
);
const mobileNav = computed(() =>
  admin.value
    ? [nav.value[0]!, nav.value[1]!, nav.value[2]!, nav.value[4]!]
    : [nav.value[0]!, nav.value[2]!, nav.value[1]!, { to: "/dashboard/more", label: t('المتجر'), icon: Store }],
);
useHead({ htmlAttrs: { class: "dash-scale dash-theme" } });
const sideMain = computed(() => nav.value.filter((n) => n.to !== "/dashboard/more"));
const sideMore = computed(() => {
  const taken = new Set(sideMain.value.map((n) => n.to));
  const extra = [
    { to: "/dashboard/catalog", label: t('الكتالوج والحسابات (تفصيلي)'), icon: BookOpen, show: admin.value },
    { to: "/dashboard/shop-profile", label: t('ملف المحل والصور'), icon: Store, show: !admin.value },
    { to: "/dashboard/legacy-orders", label: t('التحصيل وطلبات الإلغاء'), icon: Banknote, show: true },
    { to: "/dashboard/import", label: t('استيراد وإضافة (CSV)'), icon: Upload, show: true },
    { to: "/dashboard/settlements", label: t('تسويات الشحن'), icon: Wallet, show: true },
    { to: "/dashboard/returns", label: t('المرتجعات'), icon: Undo2, show: true },
    { to: "/dashboard/delivery", label: t('مناطق ورسوم التوصيل'), icon: Truck, show: admin.value },
    { to: "/dashboard/support", label: t('الدعم'), icon: Headset, show: true },
  ];
  return extra.filter((e) => e.show && !taken.has(e.to));
});
watch(() => route.path, () => { message.value = ""; error.value = ""; });
const active = (to: string) => (to === "/dashboard" ? route.path.replace(/\/$/, "") === "/dashboard" : route.path.startsWith(to));
const menuOpen = ref(false);
const title = computed(() => route.path === "/dashboard/orders" && route.query.id ? t('تفاصيل الطلب') : ({ "/dashboard/orders": t('الطلبات'), "/dashboard/add-product": t('إضافة منتج'), "/dashboard/applications": t('مراجعة المحلات'), "/dashboard/review": t('مركز المراجعة'), "/dashboard/inventory": t('المنتجات والمخزون'), "/dashboard/more": t('المزيد') } as Record<string, string>)[route.path.replace(/\/$/, "")] || (admin.value ? t('إدارة المنصة') : t('لوحة التاجر')));
</script>

<template>
  <div class="dash-root min-h-screen bg-background">
    <aside class="fixed inset-y-0 start-0 z-30 hidden w-16 flex-col border-e bg-card md:flex lg:w-64" :aria-label="t('القائمة الجانبية')">
      <div class="flex h-16 items-center justify-center gap-3 border-b px-3 lg:justify-start lg:px-5">
        <img src="/assets/reference-logo.png" :alt="t('غيار')" class="h-9 w-auto brightness-0" />
        <div class="hidden leading-tight lg:block"><div class="font-extrabold">{{ admin ? t('إدارة المنصة') : t('لوحة التاجر') }}</div><div class="text-xs text-muted-foreground">{{ t('لوحة تحكم غيار') }}</div></div>
      </div>
      <nav class="flex-1 space-y-5 overflow-y-auto p-2 lg:p-3" :aria-label="t('التنقل')">
        <div class="space-y-1">
          <p class="hidden px-3 pb-1 text-xs font-bold text-muted-foreground lg:block">{{ t('الرئيسية') }}</p>
          <NuxtLink v-for="n in sideMain" :key="n.to" :to="n.to" :title="n.label" class="flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition lg:justify-start" :class="active(n.to) ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'">
            <component :is="n.icon" class="size-5 shrink-0" /><span class="hidden lg:inline">{{ n.label }}</span>
          </NuxtLink>
        </div>
        <div class="space-y-1">
          <p class="hidden px-3 pb-1 text-xs font-bold text-muted-foreground lg:block">{{ t('المزيد') }}</p>
          <NuxtLink v-for="n in sideMore" :key="n.to" :to="n.to" :title="n.label" class="flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition lg:justify-start" :class="active(n.to) ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'">
            <component :is="n.icon" class="size-5 shrink-0" /><span class="hidden lg:inline">{{ n.label }}</span>
          </NuxtLink>
        </div>
      </nav>
      <div class="hidden border-t p-3 text-xs text-muted-foreground lg:block">{{ t('غيار • نسخة تطوير • بيانات تجريبية • الدفع كاش فقط') }}</div>
    </aside>

    <div class="flex min-h-screen min-w-0 flex-col md:ps-16 lg:ps-64">
      <header class="sticky top-0 z-20 border-b bg-background/90 backdrop-blur md:border-0 md:bg-transparent md:p-4 md:pb-0 md:backdrop-blur-0">
        <div class="flex h-14 items-center gap-2 px-3 md:h-14 md:rounded-xl md:border md:bg-card md:px-4 md:shadow-sm">
          <img src="/assets/reference-logo.png" :alt="t('غيار')" class="h-8 brightness-0 md:hidden" />
          <h1 class="min-w-0 flex-1 truncate text-lg font-extrabold">{{ title }}</h1>
          <Button v-if="route.path === '/dashboard/orders' && route.query.id" variant="outline" size="icon" :aria-label="t('كل الطلبات')" @click="navigateTo('/dashboard/orders')">‹</Button>
          <Button variant="ghost" size="icon" :aria-label="t('تنبيهات')"><Bell class="size-4" /></Button>
          <Button variant="ghost" size="sm" class="font-bold" @click="setLocale(locale === 'ar' ? 'en' : 'ar')">{{ locale === 'ar' ? 'English' : 'العربية' }}</Button>
          <Button class="hidden md:inline-flex" variant="ghost" size="icon" :aria-label="t('تحديث')" :disabled="busy" @click="dashboard"><RefreshCw class="size-4" /></Button>
          <div v-if="user" class="hidden items-center gap-2 ps-2 md:flex"><span class="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{{ (user.name || "?").slice(0, 1) }}</span><span class="hidden text-sm font-bold xl:inline">{{ user.name }}</span></div>
          <Button class="hidden md:inline-flex" variant="ghost" size="icon" :aria-label="t('خروج')" @click="logout"><LogOut class="size-4" /></Button>
          <div class="relative md:hidden">
            <Button variant="outline" size="icon" :aria-label="t('القائمة')" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen"><Menu class="size-4" /></Button>
            <div v-if="menuOpen" class="absolute end-0 top-11 z-30 w-40 space-y-1 rounded-xl border bg-card p-2 text-foreground shadow-lg" role="menu">
              <Button variant="ghost" class="w-full justify-start" role="menuitem" :aria-label="t('تحديث')" :disabled="busy" @click="menuOpen = false; dashboard()"><RefreshCw class="size-4" /> {{ t('تحديث') }}</Button>
              <Button variant="ghost" class="w-full justify-start" role="menuitem" :aria-label="t('خروج')" @click="menuOpen = false; logout()"><LogOut class="size-4" /> {{ t('خروج') }}</Button>
            </div>
          </div>
        </div>
      </header>
      <div role="main" class="mx-auto w-full max-w-[1800px] flex-1 px-3 pb-24 pt-3 md:p-4 md:pb-10">
        <div v-if="error" class="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-bold text-destructive" role="alert">{{ error }}</div>
        <div v-if="message" class="mb-3 rounded-xl border bg-secondary p-3 text-sm font-bold" role="status">{{ message }}</div>
        <NuxtPage v-if="dash" />
        <div v-else class="space-y-3" role="status" aria-live="polite" aria-busy="true">
          <p class="font-bold text-muted-foreground">{{ t('جارٍ تحميل بيانات اللوحة، ثواني...') }}</p>
          <div class="grid grid-cols-2 gap-3 xl:grid-cols-4"><div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-muted" /></div>
          <div class="h-48 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
      <footer class="hidden py-4 text-center text-xs text-muted-foreground md:block lg:hidden">{{ t('غيار • نسخة تطوير • بيانات تجريبية • الدفع كاش فقط') }}</footer>
    </div>
    <nav class="z-20 flex justify-around border-t bg-background px-1 py-2 shadow-lg md:hidden" style="position: fixed; left: 0; right: 0; top: auto; bottom: 0; height: auto; max-height: 84px" :aria-label="t('التنقل السفلي')">
      <NuxtLink v-for="n in mobileNav" :key="'b' + n.to" :to="n.to" class="flex min-w-14 flex-1 flex-col items-center gap-1 py-1 text-[13px] font-bold" :class="active(n.to) ? 'text-foreground' : 'text-muted-foreground'">
        <component :is="n.icon" class="size-7" /> {{ n.label }}
      </NuxtLink>
    </nav>
  </div>
</template>

<style>
html.dash-scale { font-size: 17px; }
@media (min-width: 768px) { html.dash-scale { font-size: 16px; } }
</style>
