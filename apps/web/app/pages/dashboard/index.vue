<script setup lang="ts">
const { t, locale } = useI18n();
import { ClipboardList, ShoppingCart, Package, FileText, Store, Clock, ChevronLeft, Info, Banknote } from "lucide-vue-next";
const { dash, money, user, statusLabels, imageUrl } = useMarket();
const admin = computed(() => user.value?.role === "ADMIN");
const todayCount = computed(() => dash.value.orders.filter((o: any) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length);
const pendingProducts = computed(() => (dash.value.products || []).filter((p: any) => !p.approved).length);
const pendingApps = computed(() => (dash.value.shopApplications || []).filter((a: any) => a.state === "PENDING").length);
const newOrders = computed(() => dash.value.orders.filter((o: any) => o.status === "PLACED").length);
const days = [t('الأحد'), t('الاثنين'), t('الثلاثاء'), t('الأربعاء'), t('الخميس'), t('الجمعة'), t('السبت')];
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
const maxDay = computed(() => Math.max(...week.value.map((w) => w.n)));
const totalWeek = computed(() => week.value.reduce((a, w) => a + w.n, 0));
const recent = computed(() => dash.value.orders.slice(0, 6));
const shopName = computed(() => dash.value.shops?.[0]?.name || t('متجرك'));
const badgeVariant = (s: string) => (s === "PLACED" ? "default" : s === "CANCELLED" ? "destructive" : "secondary");
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4 [&>*]:min-w-0">
      <template v-if="!admin">
        <Card class="gap-2 p-4"><div class="flex items-center justify-between"><span class="text-sm font-bold text-muted-foreground">{{ t('طلبات اليوم') }}</span><span class="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><ShoppingCart class="size-5" /></span></div><div class="text-3xl font-extrabold">{{ todayCount }}</div><div class="text-xs text-muted-foreground">{{ shopName }}</div></Card>
        <Card class="gap-2 p-4"><div class="flex items-center justify-between"><span class="text-sm font-bold text-muted-foreground">{{ t('منتجات') }}</span><span class="flex size-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Package class="size-5" /></span></div><div class="text-3xl font-extrabold">{{ dash.summary.offers }}</div><div class="text-xs text-muted-foreground">{{ t('عروض في متجرك') }}</div></Card>
        <Card class="gap-2 p-4"><div class="flex items-center justify-between"><span class="text-sm font-bold text-muted-foreground">{{ t('تحتاج مراجعة') }}</span><span class="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FileText class="size-5" /></span></div><div class="text-3xl font-extrabold">{{ newOrders }}</div><div class="text-xs text-muted-foreground">{{ t('طلبات جديدة') }}</div></Card>
        <Card class="gap-2 p-4"><div class="flex items-center justify-between"><span class="text-sm font-bold text-muted-foreground">{{ t('إجمالي المسلّم') }}</span><span class="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Banknote class="size-5" /></span></div><div class="text-2xl font-extrabold">{{ money(dash.summary.revenue) }}</div><div class="text-xs text-muted-foreground">{{ t('أرقام تجريبية') }}</div></Card>
      </template>
      <template v-else>
        <Card class="gap-2 p-4"><div class="flex items-center justify-between"><span class="text-sm font-bold text-muted-foreground">{{ t('المحلات') }}</span><span class="flex size-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Store class="size-5" /></span></div><div class="text-3xl font-extrabold">{{ dash.shops.length }}</div><div class="text-xs text-muted-foreground">{{ t('بانتظار الاعتماد:') }} {{ pendingApps }}</div></Card>
        <Card class="gap-2 p-4"><div class="flex items-center justify-between"><span class="text-sm font-bold text-muted-foreground">{{ t('الطلبات') }}</span><span class="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FileText class="size-5" /></span></div><div class="text-3xl font-extrabold">{{ dash.summary.orders }}</div><div class="text-xs text-muted-foreground">{{ t('اليوم:') }} {{ todayCount }}</div></Card>
        <Card class="gap-2 p-4"><div class="flex items-center justify-between"><span class="text-sm font-bold text-muted-foreground">{{ t('منتجات للمراجعة') }}</span><span class="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700"><Package class="size-5" /></span></div><div class="text-3xl font-extrabold">{{ pendingProducts }}</div><div class="text-xs text-muted-foreground">{{ t('بانتظار الموافقة') }}</div></Card>
        <Card class="gap-2 p-4"><div class="flex items-center justify-between"><span class="text-sm font-bold text-muted-foreground">{{ t('إجمالي المسلّم') }}</span><span class="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Banknote class="size-5" /></span></div><div class="text-2xl font-extrabold">{{ money(dash.summary.revenue) }}</div><div class="text-xs text-muted-foreground">{{ t('أرقام تجريبية') }}</div></Card>
      </template>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 [&>*]:min-w-0">
      <Card class="gap-3 p-5 lg:col-span-2">
        <div class="flex items-start justify-between"><div><h3 class="text-lg font-extrabold">{{ t('الطلبات الأسبوعية') }}</h3><p class="text-sm text-muted-foreground">{{ t('آخر ٧ أيام • {0} طلب', totalWeek) }}</p></div><span class="flex items-center gap-1 text-xs text-muted-foreground"><Info class="size-3" /> {{ t('بيانات اختبار') }}</span></div>
        <div class="flex h-44 items-end gap-2 pt-6 sm:h-56 sm:gap-4">
          <div v-for="w in week" :key="w.d" class="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span class="text-sm font-extrabold">{{ w.n }}</span>
            <div class="w-full rounded-lg" :class="w.n && w.n === maxDay ? 'bg-teal-600' : 'bg-teal-100'" :style="{ height: w.n ? Math.max(w.h, 4) * 0.7 + '%' : '4px' }" :title="t('{0} طلب', w.n)" />
            <span class="truncate text-xs text-muted-foreground">{{ w.d }}</span>
          </div>
        </div>
      </Card>
      <Card v-if="admin" class="gap-2 p-5">
        <h3 class="text-lg font-extrabold">{{ t('قائمة المراجعة') }}</h3>
        <NuxtLink to="/dashboard/applications" class="flex items-center gap-3 rounded-xl border p-3 hover:bg-secondary/60"><Store class="size-7" /><div class="min-w-0 flex-1"><div class="font-bold">{{ t('محلات جديدة') }}</div><div class="text-xs text-muted-foreground">{{ t('مراجعة طلبات انضمام محلات جديدة') }}</div></div><Badge>{{ pendingApps }}</Badge><ChevronLeft class="size-4" /></NuxtLink>
        <NuxtLink to="/dashboard/review" class="flex items-center gap-3 rounded-xl border p-3 hover:bg-secondary/60"><Package class="size-7" /><div class="min-w-0 flex-1"><div class="font-bold">{{ t('منتجات جديدة') }}</div><div class="text-xs text-muted-foreground">{{ t('مراجعة منتجات بانتظار الموافقة') }}</div></div><Badge>{{ pendingProducts }}</Badge><ChevronLeft class="size-4" /></NuxtLink>
      </Card>
      <Card v-else class="gap-2 p-5">
        <h3 class="text-lg font-extrabold">{{ t('إجراءات سريعة') }}</h3>
        <NuxtLink to="/dashboard/orders"><Button class="w-full" size="lg"><ClipboardList class="size-5" /> {{ t('الطلبات') }}</Button></NuxtLink>
        <NuxtLink to="/dashboard/add-product"><Button class="w-full" variant="outline" size="lg"><Package class="size-5" /> {{ t('إضافة منتج') }}</Button></NuxtLink>
      </Card>
    </div>

    <Card class="gap-2 p-5">
      <div class="flex items-center justify-between"><h3 class="flex items-center gap-2 text-lg font-extrabold"><Clock class="size-5" /> {{ t('أحدث الطلبات') }}</h3><NuxtLink to="/dashboard/orders" class="text-sm font-bold underline">{{ t('عرض الكل') }}</NuxtLink></div>
      <p v-if="!dash.orders.length" class="text-muted-foreground">{{ t('مفيش طلبات لسه.') }}</p>
      <Table v-else>
        <TableHeader><TableRow><TableHead>{{ t('رقم الطلب') }}</TableHead><TableHead>{{ t('الحالة') }}</TableHead><TableHead class="hidden md:table-cell">{{ t('المتجر') }}</TableHead><TableHead class="hidden lg:table-cell">{{ t('المنتجات') }}</TableHead><TableHead class="hidden sm:table-cell">{{ t('التاريخ') }}</TableHead><TableHead>{{ t('الإجمالي') }}</TableHead></TableRow></TableHeader>
        <TableBody>
          <TableRow v-for="o in recent" :key="o.id" class="cursor-pointer" @click="navigateTo('/dashboard/orders?id=' + o.id)">
            <TableCell><NuxtLink :to="'/dashboard/orders?id=' + o.id" class="font-bold">#{{ o.id.slice(0, 8) }}</NuxtLink></TableCell>
            <TableCell><Badge :variant="badgeVariant(o.status)">{{ statusLabels[o.status] }}</Badge></TableCell>
            <TableCell class="hidden md:table-cell">{{ o.shop.name }}</TableCell>
            <TableCell class="hidden max-w-64 truncate lg:table-cell">{{ o.items.map((i: any) => i.title).join(t('، ')) }}</TableCell>
            <TableCell class="hidden sm:table-cell">{{ new Date(o.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "ar-EG") }}</TableCell>
            <TableCell class="font-bold">{{ money(o.total) }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
</template>
