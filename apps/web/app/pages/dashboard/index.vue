<script setup lang="ts">
import { ShoppingCart, Package, FileText, Store, Clock, ChevronLeft } from "lucide-vue-next";
const { dash, money, user, statusLabels, imageUrl } = useMarket();
const admin = computed(() => user.value?.role === "ADMIN");
const todayCount = computed(() => dash.value.orders.filter((o: any) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length);
const pendingProducts = computed(() => (dash.value.products || []).filter((p: any) => !p.approved).length);
const pendingApps = computed(() => (dash.value.shopApplications || []).filter((a: any) => a.state === "PENDING").length);
const newOrders = computed(() => dash.value.orders.filter((o: any) => o.status === "PLACED").length);
const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const week = computed(() => {
  const counts = days.map(() => 0);
  const since = Date.now() - 7 * 864e5;
  for (const o of dash.value.orders) if (new Date(o.createdAt).getTime() >= since) counts[new Date(o.createdAt).getDay()]! += 1;
  const max = Math.max(1, ...counts);
  return days.map((d, i) => ({ d, n: counts[i] ?? 0, h: Math.round(((counts[i] ?? 0) / max) * 100) }));
});
const shopName = computed(() => dash.value.shops?.[0]?.name || "متجرك");
const badgeVariant = (s: string) => (s === "PLACED" ? "default" : s === "CANCELLED" ? "destructive" : "secondary");
</script>

<template>
  <div class="space-y-5">
    <Card v-if="!admin" class="flex-row items-center gap-4 p-5">
      <div class="flex size-16 items-center justify-center rounded-full bg-secondary"><Store class="size-8 text-accent" /></div>
      <div><h2 class="text-2xl font-extrabold">لوحة التاجر</h2><p class="text-muted-foreground">{{ shopName }}</p></div>
    </Card>
    <div class="grid grid-cols-3 gap-3">
      <template v-if="!admin">
        <Card class="gap-1 border-0 bg-accent p-4 text-accent-foreground"><ShoppingCart class="size-6" /><div class="text-sm font-bold">طلبات اليوم</div><div class="text-4xl font-extrabold">{{ todayCount }}</div></Card>
        <Card class="gap-1 border-0 bg-accent p-4 text-accent-foreground"><Package class="size-6" /><div class="text-sm font-bold">منتجات</div><div class="text-4xl font-extrabold">{{ dash.summary.offers }}</div></Card>
        <Card class="gap-1 border-0 bg-accent p-4 text-accent-foreground"><FileText class="size-6" /><div class="text-sm font-bold">تحتاج مراجعة</div><div class="text-4xl font-extrabold">{{ newOrders }}</div></Card>
      </template>
      <template v-else>
        <Card class="gap-1 border-0 bg-orange-50 p-4"><Store class="size-6 text-accent" /><div class="text-sm font-bold">المحلات</div><div class="text-4xl font-extrabold text-accent">{{ dash.shops.length }}</div></Card>
        <Card class="gap-1 border-0 bg-blue-50 p-4"><FileText class="size-6 text-primary" /><div class="text-sm font-bold">الطلبات</div><div class="text-4xl font-extrabold text-primary">{{ dash.summary.orders }}</div></Card>
        <Card class="gap-1 border-0 bg-orange-50 p-4"><Package class="size-6 text-accent" /><div class="text-sm font-bold">منتجات للمراجعة</div><div class="text-4xl font-extrabold text-accent">{{ pendingProducts }}</div></Card>
      </template>
    </div>
    <p class="text-center text-xs text-muted-foreground">أرقام تجريبية من قاعدة بيانات الاختبار • إجمالي المسلّم {{ money(dash.summary.revenue) }}</p>

    <Card v-if="admin" class="p-5">
      <h3 class="mb-3 font-extrabold">الطلبات الأسبوعية (آخر ٧ أيام)</h3>
      <div class="flex h-44 items-end gap-3">
        <div v-for="w in week" :key="w.d" class="flex h-full flex-1 flex-col items-center gap-1">
          <span class="text-xs font-bold">{{ w.n }}</span>
          <div class="flex w-full flex-1 items-end"><div class="w-full rounded-t-md bg-accent" :style="{ height: Math.max(4, w.h) + '%' }" /></div>
          <span class="text-[10px] text-muted-foreground">{{ w.d }}</span>
        </div>
      </div>
    </Card>

    <div v-if="admin" class="space-y-2">
      <h3 class="font-extrabold">قائمة المراجعة</h3>
      <NuxtLink to="/dashboard/applications"><Card class="flex-row items-center gap-3 p-4"><Store class="size-8 text-primary" /><div class="flex-1"><div class="font-bold">محلات جديدة</div><div class="text-xs text-muted-foreground">مراجعة طلبات انضمام محلات جديدة</div></div><Badge class="bg-accent text-accent-foreground">{{ pendingApps }}</Badge><ChevronLeft class="size-4" /></Card></NuxtLink>
      <NuxtLink to="/dashboard/review"><Card class="flex-row items-center gap-3 p-4"><Package class="size-8 text-primary" /><div class="flex-1"><div class="font-bold">منتجات جديدة</div><div class="text-xs text-muted-foreground">مراجعة منتجات بانتظار الموافقة</div></div><Badge class="bg-accent text-accent-foreground">{{ pendingProducts }}</Badge><ChevronLeft class="size-4" /></Card></NuxtLink>
    </div>

    <Card class="p-5">
      <div class="mb-3 flex items-center justify-between"><h3 class="flex items-center gap-2 font-extrabold"><Clock class="size-5" /> أحدث الطلبات</h3><NuxtLink to="/dashboard/orders" class="text-sm font-bold text-primary">عرض الكل</NuxtLink></div>
      <p v-if="!dash.orders.length" class="text-muted-foreground">مفيش طلبات لسه.</p>
      <NuxtLink v-for="o in dash.orders.slice(0, 3)" :key="o.id" :to="'/dashboard/orders?id=' + o.id" class="flex items-center gap-3 border-t py-3">
        <img :src="imageUrl(o.items[0]?.offer?.product?.image || '/assets/shop-icon.png')" alt="" class="size-16 rounded-xl border bg-secondary object-cover" />
        <div class="flex-1"><div class="font-bold">#{{ o.id.slice(0, 8) }} • {{ o.shop.name }}</div><div class="text-xs text-muted-foreground">{{ o.items[0]?.title }} • {{ new Date(o.createdAt).toLocaleDateString("ar-EG") }}</div></div>
        <Badge :variant="badgeVariant(o.status)">{{ statusLabels[o.status] }}</Badge>
      </NuxtLink>
      <div v-if="!admin" class="mt-3 grid grid-cols-2 gap-3"><NuxtLink to="/dashboard/orders"><Button class="w-full bg-accent text-accent-foreground" size="lg">الطلبات</Button></NuxtLink><NuxtLink to="/dashboard/add-product"><Button class="w-full" variant="outline" size="lg">إضافة منتج</Button></NuxtLink></div>
    </Card>
  </div>
</template>
