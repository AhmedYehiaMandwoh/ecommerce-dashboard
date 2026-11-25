<script setup lang="ts">
const { t } = useI18n();
import { MapPin, ClipboardList, Truck, Banknote } from "lucide-vue-next";
const { busy, dash, decideCancellation, decisionForm, imageUrl, money, next, status, statusLabels, user } = useMarket();
const route = useRoute();
const router = useRouter();
const selectedId = computed(() => String(route.query.id || ""));
const selected = computed(() => dash.value.orders.find((o: any) => o.id === selectedId.value));
const badgeVariant = (s: string) => (s === "PLACED" ? "default" : s === "CANCELLED" ? "destructive" : "secondary");
const target = ref("");
const tracking = ref("");
watch(selected, (o) => { target.value = o ? next[o.status] || "" : ""; tracking.value = o?.trackingNumber || ""; }, { immediate: true });
const options = computed(() => (selected.value ? [selected.value.status, ...(next[selected.value.status] ? [next[selected.value.status]] : []), ...(["PLACED", "ACCEPTED", "PREPARING"].includes(selected.value.status) ? ["CANCELLED"] : [])] : []));
async function update() {
  if (!selected.value || !target.value || target.value === selected.value.status) return;
  await status(selected.value.id, target.value, tracking.value.trim() || undefined);
}
</script>

<template>
  <div class="space-y-2">
    <template v-if="selected">
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3 [&>*]:min-w-0">
      <Card class="gap-2 p-3">
        <div class="flex items-start justify-between">
          <Badge :variant="badgeVariant(selected.status)">{{ statusLabels[selected.status] }}</Badge>
          <div class="text-start"><h2 class="text-lg font-extrabold">{{ t('طلب #') }}{{ selected.id.slice(0, 8) }}</h2><p class="text-sm text-muted-foreground">{{ selected.shop.name }}</p></div>
        </div>
        <div v-for="i in selected.items" :key="i.id" class="mt-1 flex items-center gap-3 rounded-xl bg-secondary p-1.5">
          <img :src="imageUrl(i.offer?.product?.image || '/assets/shop-icon.png')" alt="" class="size-12 rounded-lg bg-white object-contain" />
          <div class="flex-1 text-start"><div class="font-bold">{{ i.title }}</div><div class="text-xs text-muted-foreground">{{ i.partNumber }}</div></div>
          <b>×{{ i.quantity }}</b>
        </div>
      </Card>
      <Card class="gap-2 p-3"><h3 class="flex items-center gap-2 text-base font-extrabold"><MapPin class="size-4" /> {{ t('عنوان الشحن') }}</h3>
        <div class="rounded-xl bg-secondary p-2 text-xs">{{ selected.address.city }} • {{ selected.address.details }}<br /><span dir="ltr">{{ selected.address.phone }}</span></div></Card>
<Card class="gap-2 p-3">
<h3 class="flex items-center gap-2 text-base font-extrabold"><ClipboardList class="size-4" /> {{ t('حالة الطلب') }}</h3>
        <Select v-model="target" :disabled="busy || selected.settlementFrozen || !options.length">
          <SelectTrigger class="w-full"><SelectValue :placeholder="t('اختر الحالة')" /></SelectTrigger>
          <SelectContent><SelectItem v-for="o in [...new Set(options)]" :key="o" :value="o">{{ statusLabels[o] }}</SelectItem></SelectContent>
        </Select>
</Card>
<Card class="gap-2 p-3">
<h3 class="flex items-center gap-2 text-base font-extrabold"><Truck class="size-4" /> {{ t('رقم الشحنة (اختياري)') }}</h3>
<Input v-model="tracking" :placeholder="t('أدخل رقم الشحنة')" dir="ltr" maxlength="40" />
</Card>
        <Button class="mt-0 w-full bg-accent text-accent-foreground" size="lg" :disabled="busy || !target || target === selected.status || (tracking.trim().length > 0 && !/^[A-Za-z0-9\-_.\/ ]{3,40}$/.test(tracking.trim()))" @click="update">{{ t('تحديث الحالة') }}</Button>
      <Card class="p-3"><h3 class="mb-2 flex items-center gap-2 font-extrabold"><Banknote class="size-5" /> {{ t('التحصيل عند التسليم') }}</h3>
        <p class="text-sm">{{ t('منتجات:') }} {{ money(selected.subtotal) }}<span v-if="selected.discount"> {{ t('(بعد خصم') }} {{ money(selected.discount) }})</span> {{ t('• حصة شحن للمنصة:') }} {{ money(selected.delivery) }}</p>
        <p class="font-extrabold">{{ t('الإجمالي:') }} {{ money(selected.total) }}</p><p v-if="selected.trackingNumber" class="mt-1 text-sm">{{ t('رقم الشحنة:') }} <b dir="ltr">{{ selected.trackingNumber }}</b></p></Card>
      </div>
    </template>
    <template v-else>
      <p v-if="!dash.orders.length" class="text-muted-foreground">{{ t('مفيش طلبات لسه.') }}</p>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3 [&>*]:min-w-0"><Card v-for="o in dash.orders" :key="o.id" class="cursor-pointer flex-row items-center gap-3 p-4" role="button" :aria-label="t('طلب {0}', o.id.slice(0, 8))" @click="router.push('/dashboard/orders?id=' + o.id)">
        <img :src="imageUrl(o.items[0]?.offer?.product?.image || '/assets/shop-icon.png')" alt="" class="size-14 rounded-lg bg-secondary object-contain" />
        <div class="min-w-0 flex-1"><div class="truncate font-bold">#{{ o.id.slice(0, 8) }}</div><div class="truncate text-sm">{{ o.shop.name }}</div><div class="truncate text-xs text-muted-foreground">{{ o.items.map((i: any) => i.title).join(t('، ')) }}</div></div>
        <div class="flex shrink-0 flex-col items-end gap-1"><b class="text-sm">{{ money(o.total) }}</b><Badge :variant="badgeVariant(o.status)">{{ statusLabels[o.status] }}</Badge></div>
      </Card></div>
    </template>
  </div>
</template>
