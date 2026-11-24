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
const active = (to: string) => (to === "/dashboard" ? route.path.replace(/\/$/, "") === "/dashboard" : route.path.startsWith(to));
const title = computed(() => ({ "/dashboard/orders": "الطلبات", "/dashboard/add-product": "إضافة منتج", "/dashboard/applications": "مراجعة المحلات", "/dashboard/review": "مركز المراجعة", "/dashboard/inventory": "المنتجات والمخزون", "/dashboard/more": "المزيد" } as Record<string, string>)[route.path.replace(/\/$/, "")] || (admin.value ? "إدارة المنصة" : "لوحة التاجر"));
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-6xl flex-col">
    <header class="flex items-center justify-between bg-primary px-6 py-4 text-primary-foreground md:rounded-b-3xl">
      <div class="flex items-center gap-3">
        <img src="/assets/reference-logo.png" alt="غيار" class="h-10 brightness-0 invert" />
        <h1 class="text-xl font-extrabold">{{ title }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="secondary" size="sm" :disabled="busy" @click="dashboard"><RefreshCw class="size-4" /> تحديث</Button>
        <Button variant="secondary" size="icon" aria-label="تنبيهات"><Bell class="size-4" /></Button>
        <Button variant="secondary" size="sm" @click="logout"><LogOut class="size-4" /> خروج</Button>
      </div>
    </header>
    <nav class="sticky top-0 z-10 mt-3 flex gap-1 overflow-x-auto bg-background/90 px-4 py-2 backdrop-blur" aria-label="التنقل">
      <NuxtLink v-for="n in nav" :key="n.to" :to="n.to" class="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition" :class="active(n.to) ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'">
        <component :is="n.icon" class="size-4" /> {{ n.label }}
      </NuxtLink>
    </nav>
    <main class="flex-1 px-4 pb-10 pt-3">
      <div v-if="error" class="mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-bold text-destructive" role="alert">{{ error }}</div>
      <div v-if="message" class="mb-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm font-bold text-primary" role="status">{{ message }}</div>
      <NuxtPage v-if="dash" />
      <p v-else class="text-muted-foreground">جارٍ التحميل...</p>
    </main>
    <footer class="py-4 text-center text-xs text-muted-foreground">غيار • نسخة تطوير • بيانات تجريبية • الدفع كاش فقط</footer>
  </div>
</template>
