<script setup lang="ts">
import { Bell, ClipboardList, Home, Package, Store, MoreHorizontal, LogOut, ShieldCheck, RefreshCw } from "lucide-vue-next";
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
watch(() => route.path, () => { message.value = ""; error.value = ""; });
const active = (to: string) => (to === "/dashboard" ? route.path.replace(/\/$/, "") === "/dashboard" : route.path.startsWith(to));
const title = computed(() => route.path === "/dashboard/orders" && route.query.id ? "تفاصيل الطلب" : ({ "/dashboard/orders": "الطلبات", "/dashboard/add-product": "إضافة منتج", "/dashboard/applications": "مراجعة المحلات", "/dashboard/review": "مركز المراجعة", "/dashboard/inventory": "المنتجات والمخزون", "/dashboard/more": "المزيد" } as Record<string, string>)[route.path.replace(/\/$/, "")] || (admin.value ? "إدارة المنصة" : "لوحة التاجر"));
</script>

<template>
  <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
    <header class="relative bg-primary px-4 pb-2 pt-2 text-primary-foreground md:flex md:items-center md:justify-between md:rounded-b-3xl md:px-6 md:py-4">
      <div class="flex w-full flex-col items-center gap-1 md:w-auto md:flex-row md:gap-3">
        <img src="/assets/reference-logo.png" alt="غيار" class="h-9 brightness-0 invert md:h-10" />
        <h1 class="text-xl font-extrabold md:text-xl">{{ title }}</h1>
      </div>
      <div class="absolute inset-x-3 top-3 flex items-center justify-between md:static md:inset-auto md:justify-end md:gap-2">
        <div class="flex items-center gap-2">
          <Button variant="secondary" size="icon" aria-label="خروج" @click="logout"><LogOut class="size-4" /></Button>
          <Button variant="secondary" size="icon" aria-label="تنبيهات"><Bell class="size-4" /></Button>
          <Button v-if="route.path === '/dashboard/orders' && route.query.id" variant="secondary" size="icon" aria-label="كل الطلبات" @click="navigateTo('/dashboard/orders')">‹</Button>
        </div>
        <Button variant="secondary" size="icon" aria-label="تحديث" :disabled="busy" @click="dashboard"><RefreshCw class="size-4" /></Button>
      </div>
    </header>
    <nav class="sticky top-0 z-10 mt-3 hidden gap-1 md:flex overflow-x-auto bg-background/90 px-4 py-2 backdrop-blur" aria-label="التنقل">
      <NuxtLink v-for="n in nav" :key="n.to" :to="n.to" class="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition" :class="active(n.to) ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'">
        <component :is="n.icon" class="size-4" /> {{ n.label }}
      </NuxtLink>
    </nav>
    <div role="main" class="w-full flex-1 px-3 pb-20 pt-2 md:pb-10">
      <div v-if="error" class="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-bold text-destructive" role="alert">{{ error }}</div>
      <div v-if="message" class="mb-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm font-bold text-primary" role="status">{{ message }}</div>
      <NuxtPage v-if="dash" />
      <div v-else class="space-y-3" role="status" aria-live="polite" aria-busy="true">
        <p class="font-bold text-muted-foreground">جارٍ تحميل بيانات اللوحة، ثواني...</p>
        <div class="grid grid-cols-3 gap-3"><div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-2xl bg-muted" /></div>
        <div class="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
    <footer class="hidden py-4 text-center md:block text-xs text-muted-foreground">غيار • نسخة تطوير • بيانات تجريبية • الدفع كاش فقط</footer>
    <nav class="z-20 flex justify-around border-t bg-background px-1 py-2 shadow-lg md:hidden" style="position: fixed; left: 0; right: 0; top: auto; bottom: 0; height: auto; max-height: 80px" aria-label="التنقل السفلي">
      <NuxtLink v-for="n in nav" :key="'b' + n.to" :to="n.to" class="flex min-w-14 flex-1 flex-col items-center gap-1 py-1 text-[11px] font-bold" :class="active(n.to) ? 'text-accent' : 'text-muted-foreground'">
        <component :is="n.icon" class="size-6" /> {{ n.label }}
      </NuxtLink>
    </nav>
  </div>
</template>
