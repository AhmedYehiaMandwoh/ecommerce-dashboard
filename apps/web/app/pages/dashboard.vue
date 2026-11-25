<script setup lang="ts">
import { Bell, ClipboardList, Home, Package, Store, MoreHorizontal, LogOut, ShieldCheck, RefreshCw, Menu, Boxes, Upload, Wallet, Undo2, Truck, Headset, Banknote, BookOpen, PackagePlus } from "lucide-vue-next";
const { dash, dashboard, user, logout, error, message, busy } = useMarket();
const route = useRoute();
const admin = computed(() => user.value?.role === "ADMIN");
const nav = computed(() =>
  admin.value
    ? [
        { to: "/dashboard", label: "نظرة عامة", icon: Home },
        { to: "/dashboard/applications", label: "المحلات", icon: Store },
        { to: "/dashboard/orders", label: "الطلبات", icon: ClipboardList },
        { to: "/dashboard/review", label: "المراجعة", icon: ShieldCheck },
        { to: "/dashboard/more", label: "المزيد", icon: MoreHorizontal },
      ]
    : [
        { to: "/dashboard", label: "الرئيسية", icon: Home },
        { to: "/dashboard/orders", label: "الطلبات", icon: ClipboardList },
        { to: "/dashboard/inventory", label: "المنتجات", icon: Package },
        { to: "/dashboard/add-product", label: "إضافة منتج", icon: Store },
        { to: "/dashboard/more", label: "المزيد", icon: MoreHorizontal },
      ],
);
const mobileNav = computed(() =>
  admin.value
    ? [nav.value[0]!, nav.value[1]!, nav.value[2]!, nav.value[4]!]
    : [nav.value[0]!, nav.value[2]!, nav.value[1]!, { to: "/dashboard/more", label: "المتجر", icon: Store }],
);
useHead({ htmlAttrs: { class: "dash-scale dash-theme" } });
const sideMain = computed(() => nav.value.filter((n) => n.to !== "/dashboard/more"));
const sideMore = computed(() => {
  const taken = new Set(sideMain.value.map((n) => n.to));
  const extra = [
    { to: "/dashboard/catalog", label: "الكتالوج والحسابات (تفصيلي)", icon: BookOpen, show: admin.value },
    { to: "/dashboard/shop-profile", label: "ملف المحل والصور", icon: Store, show: !admin.value },
    { to: "/dashboard/legacy-orders", label: "التحصيل وطلبات الإلغاء", icon: Banknote, show: true },
    { to: "/dashboard/import", label: "استيراد وإضافة (CSV)", icon: Upload, show: true },
    { to: "/dashboard/settlements", label: "تسويات الشحن", icon: Wallet, show: true },
    { to: "/dashboard/returns", label: "المرتجعات", icon: Undo2, show: true },
    { to: "/dashboard/delivery", label: "مناطق ورسوم التوصيل", icon: Truck, show: admin.value },
    { to: "/dashboard/support", label: "الدعم", icon: Headset, show: true },
  ];
  return extra.filter((e) => e.show && !taken.has(e.to));
});
watch(() => route.path, () => { message.value = ""; error.value = ""; });
const active = (to: string) => (to === "/dashboard" ? route.path.replace(/\/$/, "") === "/dashboard" : route.path.startsWith(to));
const menuOpen = ref(false);
const title = computed(() => route.path === "/dashboard/orders" && route.query.id ? "تفاصيل الطلب" : ({ "/dashboard/orders": "الطلبات", "/dashboard/add-product": "إضافة منتج", "/dashboard/applications": "مراجعة المحلات", "/dashboard/review": "مركز المراجعة", "/dashboard/inventory": "المنتجات والمخزون", "/dashboard/more": "المزيد" } as Record<string, string>)[route.path.replace(/\/$/, "")] || (admin.value ? "إدارة المنصة" : "لوحة التاجر"));
</script>

<template>
  <div class="dash-root min-h-screen bg-background">
    <aside class="fixed inset-y-0 start-0 z-30 hidden w-16 flex-col border-e bg-card md:flex lg:w-64" aria-label="القائمة الجانبية">
      <div class="flex h-16 items-center justify-center gap-3 border-b px-3 lg:justify-start lg:px-5">
        <img src="/assets/reference-logo.png" alt="غيار" class="h-9 w-auto brightness-0" />
        <div class="hidden leading-tight lg:block"><div class="font-extrabold">{{ admin ? "إدارة المنصة" : "لوحة التاجر" }}</div><div class="text-xs text-muted-foreground">لوحة تحكم غيار</div></div>
      </div>
      <nav class="flex-1 space-y-5 overflow-y-auto p-2 lg:p-3" aria-label="التنقل">
        <div class="space-y-1">
          <p class="hidden px-3 pb-1 text-xs font-bold text-muted-foreground lg:block">الرئيسية</p>
          <NuxtLink v-for="n in sideMain" :key="n.to" :to="n.to" :title="n.label" class="flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition lg:justify-start" :class="active(n.to) ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'">
            <component :is="n.icon" class="size-5 shrink-0" /><span class="hidden lg:inline">{{ n.label }}</span>
          </NuxtLink>
        </div>
        <div class="space-y-1">
          <p class="hidden px-3 pb-1 text-xs font-bold text-muted-foreground lg:block">المزيد</p>
          <NuxtLink v-for="n in sideMore" :key="n.to" :to="n.to" :title="n.label" class="flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition lg:justify-start" :class="active(n.to) ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'">
            <component :is="n.icon" class="size-5 shrink-0" /><span class="hidden lg:inline">{{ n.label }}</span>
          </NuxtLink>
        </div>
      </nav>
      <div class="hidden border-t p-3 text-xs text-muted-foreground lg:block">غيار • نسخة تطوير • بيانات تجريبية • الدفع كاش فقط</div>
    </aside>

    <div class="flex min-h-screen min-w-0 flex-col md:ps-16 lg:ps-64">
      <header class="sticky top-0 z-20 border-b bg-background/90 backdrop-blur md:border-0 md:bg-transparent md:p-4 md:pb-0 md:backdrop-blur-0">
        <div class="flex h-14 items-center gap-2 px-3 md:h-14 md:rounded-xl md:border md:bg-card md:px-4 md:shadow-sm">
          <img src="/assets/reference-logo.png" alt="غيار" class="h-8 brightness-0 md:hidden" />
          <h1 class="min-w-0 flex-1 truncate text-lg font-extrabold">{{ title }}</h1>
          <Button v-if="route.path === '/dashboard/orders' && route.query.id" variant="outline" size="icon" aria-label="كل الطلبات" @click="navigateTo('/dashboard/orders')">‹</Button>
          <Button variant="ghost" size="icon" aria-label="تنبيهات"><Bell class="size-4" /></Button>
          <Button class="hidden md:inline-flex" variant="ghost" size="icon" aria-label="تحديث" :disabled="busy" @click="dashboard"><RefreshCw class="size-4" /></Button>
          <div v-if="user" class="hidden items-center gap-2 ps-2 md:flex"><span class="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{{ (user.name || "?").slice(0, 1) }}</span><span class="hidden text-sm font-bold xl:inline">{{ user.name }}</span></div>
          <Button class="hidden md:inline-flex" variant="ghost" size="icon" aria-label="خروج" @click="logout"><LogOut class="size-4" /></Button>
          <div class="relative md:hidden">
            <Button variant="outline" size="icon" aria-label="القائمة" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen"><Menu class="size-4" /></Button>
            <div v-if="menuOpen" class="absolute end-0 top-11 z-30 w-40 space-y-1 rounded-xl border bg-card p-2 text-foreground shadow-lg" role="menu">
              <Button variant="ghost" class="w-full justify-start" role="menuitem" aria-label="تحديث" :disabled="busy" @click="menuOpen = false; dashboard()"><RefreshCw class="size-4" /> تحديث</Button>
              <Button variant="ghost" class="w-full justify-start" role="menuitem" aria-label="خروج" @click="menuOpen = false; logout()"><LogOut class="size-4" /> خروج</Button>
            </div>
          </div>
        </div>
      </header>
      <div role="main" class="mx-auto w-full max-w-[1800px] flex-1 px-3 pb-24 pt-3 md:p-4 md:pb-10">
        <div v-if="error" class="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-bold text-destructive" role="alert">{{ error }}</div>
        <div v-if="message" class="mb-3 rounded-xl border bg-secondary p-3 text-sm font-bold" role="status">{{ message }}</div>
        <NuxtPage v-if="dash" />
        <div v-else class="space-y-3" role="status" aria-live="polite" aria-busy="true">
          <p class="font-bold text-muted-foreground">جارٍ تحميل بيانات اللوحة، ثواني...</p>
          <div class="grid grid-cols-2 gap-3 xl:grid-cols-4"><div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-2xl bg-muted" /></div>
          <div class="h-48 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
      <footer class="hidden py-4 text-center text-xs text-muted-foreground md:block lg:hidden">غيار • نسخة تطوير • بيانات تجريبية • الدفع كاش فقط</footer>
    </div>
    <nav class="z-20 flex justify-around border-t bg-background px-1 py-2 shadow-lg md:hidden" style="position: fixed; left: 0; right: 0; top: auto; bottom: 0; height: auto; max-height: 84px" aria-label="التنقل السفلي">
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
