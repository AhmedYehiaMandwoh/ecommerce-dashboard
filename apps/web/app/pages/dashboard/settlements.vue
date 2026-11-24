<script setup lang="ts">
const { busy, dash, money, settleShipping, settlementForm, shippingBalance, user } = useMarket();
const rows = computed(() => dash.value.orders.filter((o: any) => o.shippingEntries?.length));
const kind = (k: string) => (k === "COLLECTED_FOR_PLATFORM" ? "تحصيل نيابة عن المنصة" : k === "REMITTANCE" ? "توريد" : "مقاصة");
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-extrabold">تسويات شحن المنصة</h2>
    <p class="rounded-lg bg-secondary p-3 text-sm">السجل يثبت تحصيل المتجر لحصة الشحن نيابة عن المنصة وتوريدها أو مقاصتها. تسجيل تسوية لا ينفّذ تحويلًا ماليًا. احتفظ بإثبات خارجي لكل مبلغ.</p>
    <p v-if="!rows.length" class="text-muted-foreground">لا توجد حصص شحن محصلة لسه.</p>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
      <Card v-for="o in rows" :key="o.id" class="space-y-3 p-5">
        <div class="flex items-center justify-between"><h3 class="font-extrabold">{{ o.shop.name }} • #{{ o.id.slice(0, 8) }}</h3><Badge>{{ money(shippingBalance(o)) }}</Badge></div>
        <p class="text-sm text-muted-foreground">رصيد مستحق للمنصة</p>
        <p v-if="o.settlementFrozen" class="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">التسوية مجمدة أثناء مراجعة الإلغاء</p>
        <div v-for="e in o.shippingEntries" :key="e.id" class="border-t pt-2 text-sm"><b>{{ kind(e.kind) }} • {{ money(e.amount) }}</b><p class="text-xs text-muted-foreground">{{ new Date(e.createdAt).toLocaleString("ar-EG") }} • {{ e.reference }} • {{ e.note }}</p></div>
        <form v-if="user.role === 'ADMIN' && !o.settlementFrozen && shippingBalance(o) > 0" class="space-y-2 border-t pt-3" @submit.prevent="settleShipping(o)">
          <Label>المبلغ بالقرش</Label><Input v-model.number="settlementForm(o).amount" type="number" min="1" :max="shippingBalance(o)" required />
          <Label>طريقة التسوية</Label>
          <Select v-model="settlementForm(o).method"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="REMITTANCE">توريد مثبت</SelectItem><SelectItem value="OFFSET">مقاصة مثبتة</SelectItem></SelectContent></Select>
          <Label>رقم إثبات فريد</Label><Input v-model="settlementForm(o).reference" required minlength="8" maxlength="120" />
          <Label>تفاصيل الإثبات</Label><Textarea v-model="settlementForm(o).note" required minlength="5" maxlength="180" />
          <Button type="submit" class="w-full" :disabled="busy">تسجيل تسوية مثبتة</Button>
        </form>
      </Card>
    </div>
  </div>
</template>
