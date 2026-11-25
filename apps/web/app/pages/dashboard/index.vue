<script setup lang="ts">
import { ShoppingCart, Package, FileText, Store, Clock, ChevronLeft, Info } from "lucide-vue-next";
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
  return days.map((d, i) => ({ d, n: counts[i] ?? 0, h: Math.round(((counts[i] ?? 0) / yMax.value) * 100) }));
});
const yMax = computed(() => {
  const m = Math.max(1, ...(() => { const c = days.map(() => 0); const since = Date.now() - 7 * 864e5; for (const o of dash.value.orders) if (new Date(o.createdAt).getTime() >= since) c[new Date(o.createdAt).getDay()]! += 1; return c; })());
  const step = m <= 4 ? 1 : m <= 12 ? 4 : m <= 40 ? 10 : m <= 80 ? 20 : Math.pow(10, String(m).length - 1) * 2;
  return Math.ceil(m / step) * step;
});
const yTicks = computed(() => { const n = yMax.value <= 4 ? yMax.value : 4; return Array.from({ length: n + 1 }, (_, i) => Math.round((yMax.value / n) * (n - i))); });
const shopName = computed(() => dash.value.shops?.[0]?.name || "متجرك");
const badgeVariant = (s: string) => (s === "PLACED" ? "default" : s === "CANCELLED" ? "destructive" : "secondary");
</script>

<template>
  <div class="space-y-3">
    <Card v-if="!admin" class="flex-row items-center gap-3 p-3">
      <div class="flex size-12 items-center justify-center rounded-full bg-secondary"><Store class="size-6 text-accent" /></div>
      <div><h2 class="text-xl font-extrabold">لوحة التاجر</h2><p class="text-muted-foreground">{{ shopName }}</p></div>
    </Card>
    <div class="grid grid-cols-3 gap-2">
      <template v-if="!admin">
        <Card class="gap-0.5 border-0 bg-accent p-3 text-accent-foreground"><ShoppingCart class="size-6" /><div class="text-sm font-bold">طلبات اليوم</div><div class="text-3xl font-extrabold">{{ todayCount }}</div></Card>
        <Card class="gap-0.5 border-0 bg-accent p-3 text-accent-foreground"><Package class="size-6" /><div class="text-sm font-bold">منتجات</div><div class="text-3xl font-extrabold">{{ dash.summary.offers }}</div></Card>
        <Card class="gap-0.5 border-0 bg-accent p-3 text-accent-foreground"><FileText class="size-6" /><div class="text-sm font-bold">تحتاج مراجعة</div><div class="text-3xl font-extrabold">{{ newOrders }}</div></Card>
      </template>
      <template v-else>
        <Card class="gap-0.5 border-0 bg-orange-50 p-3"><Store class="size-6 text-accent" /><div class="whitespace-nowrap text-xs font-bold">المحلات</div><div class="text-3xl font-extrabold text-accent">{{ dash.shops.length }}</div></Card>
        <Card class="gap-0.5 border-0 bg-blue-50 p-3"><FileText class="size-6 text-primary" /><div class="whitespace-nowrap text-xs font-bold">الطلبات</div><div class="text-3xl font-extrabold text-primary">{{ dash.summary.orders }}</div></Card>
        <Card class="gap-0.5 border-0 bg-orange-50 p-3"><Package class="size-6 text-accent" /><div class="whitespace-nowrap text-xs font-bold">منتجات للمراجعة</div><div class="text-3xl font-extrabold text-accent">{{ pendingProducts }}</div></Card>
      </template>
    </div>
    <p class="text-center text-xs text-muted-foreground">أرقام تجريبية من قاعدة بيانات الاختبار • إجمالي المسلّم {{ money(dash.summary.revenue) }}</p>

    <Card v-if="admin" class="p-3">
      <div class="mb-2 flex items-center justify-between"><h3 class="font-extrabold">الطلبات الأسبوعية (آخر ٧ أيام)</h3><span class="flex items-center gap-1 text-[10px] text-muted-foreground"><Info class="size-3" /> بيانات اختبار</span></div>
      <div class="flex gap-2">
        <div class="flex h-20 flex-col justify-between pb-0 text-[10px] text-muted-foreground" dir="ltr"><span v-for="t in yTicks" :key="t" class="leading-none">{{ t }}</span></div>
        <div class="relative flex-1">
          <div class="pointer-events-none absolute inset-x-0 top-0 flex h-20 flex-col justify-between"><i v-for="t in yTicks" :key="t" class="block border-t border-dashed border-border" /></div>
          <div class="relative flex h-20 items-end gap-2">
            <div v-for="w in week" :key="w.d" class="flex h-full flex-1 items-end"><div class="w-full rounded-t-md bg-accent" :style="{ height: w.n ? w.h + '%' : '2px' }" :title="w.n + ' طلب'" /></div>
          </div>
          <div class="mt-1 flex gap-2"><span v-for="w in week" :key="w.d" class="flex-1 text-center text-[10px] text-muted-foreground">{{ w.d }}</span></div>
        </div>
      </div>
    </Card>

    <div v-if="admin" class="space-y-2">
      <h3 class="font-extrabold">قائمة المراجعة</h3>
      <NuxtLink to="/dashboard/applications"><Card class="flex-row items-center gap-3 p-3"><Store class="size-8 text-primary" /><div class="flex-1"><div class="font-bold">محلات جديدة</div><div class="text-xs text-muted-foreground">مراجعة طلبات انضمام محلات جديدة</div></div><Badge class="bg-accent text-accent-foreground">{{ pendingApps }}</Badge><ChevronLeft class="size-4" /></Card></NuxtLink>
      <NuxtLink to="/dashboard/review"><Card class="flex-row items-center gap-3 p-3"><Package class="size-8 text-primary" /><div class="flex-1"><div class="font-bold">منتجات جديدة</div><div class="text-xs text-muted-foreground">مراجعة منتجات بانتظار الموافقة</div></div><Badge class="bg-accent text-accent-foreground">{{ pendingProducts }}</Badge><ChevronLeft class="size-4" /></Card></NuxtLink>
    </div>

    <Card class="p-3">
      <div class="mb-2 flex items-center justify-between"><h3 class="flex items-center gap-2 font-extrabold"><Clock class="size-5" /> أحدث الطلبات</h3><NuxtLink to="/dashboard/orders" class="text-sm font-bold text-primary">عرض الكل</NuxtLink></div>
      <p v-if="!dash.orders.length" class="text-muted-foreground">مفيش طلبات لسه.</p>
      <NuxtLink v-for="o in dash.orders.slice(0, admin ? 3 : 2)" :key="o.id" :to="'/dashboard/orders?id=' + o.id" class="flex items-center gap-3 border-t py-2">
        <div class="flex shrink-0 flex-col items-center gap-1"><Badge :variant="badgeVariant(o.status)">{{ statusLabels[o.status] }}</Badge><span class="text-[10px] text-muted-foreground">{{ new Date(o.createdAt).toLocaleDateString("ar-EG") }}</span></div>
        <div class="min-w-0 flex-1"><div class="truncate font-bold">#{{ o.id.slice(0, 8) }}</div><div class="truncate text-xs text-muted-foreground">{{ o.items[0]?.title }}<template v-if="admin"> • {{ o.shop.name }}</template></div></div>
        <img :src="imageUrl(o.items[0]?.offer?.product?.image || '/assets/shop-icon.png')" alt="" class="size-14 rounded-xl border bg-secondary object-contain" />
      </NuxtLink>
      <div v-if="!admin" class="mt-3 grid grid-cols-2 gap-3"><NuxtLink to="/dashboard/orders"><Button class="w-full bg-accent text-accent-foreground" size="lg">الطلبات</Button></NuxtLink><NuxtLink to="/dashboard/add-product"><Button class="w-full" variant="outline" size="lg">إضافة منتج</Button></NuxtLink></div>
    </Card>
  </div>
</template>
