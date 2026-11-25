<script setup lang="ts">
const { busy, dash, decideReturn, money, recordRefund, refundForm, returnDecision, user } = useMarket();
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-extrabold">الإرجاع ورد النقدية</h2>
    <p class="rounded-lg bg-secondary p-3 text-sm">إدارة حالات اختبار، لا قبول تلقائي ولا تحويل أموال. رد النقدية لا يشمل الشحن تلقائيًا. المراجعة ليست سياسة تجارية.</p>
    <p v-if="!dash.orders.some((o: any) => o.returns?.length)" class="text-muted-foreground">لا توجد حالات إرجاع.</p>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3 [&>*]:min-w-0">
      <template v-for="o in dash.orders" :key="o.id">
        <Card v-for="r in o.returns" :key="r.id" class="space-y-3 p-5">
          <div class="flex items-center justify-between"><h3 class="font-extrabold">#{{ o.id.slice(0, 8) }} • {{ o.shop.name }}</h3><Badge>{{ r.state }}</Badge></div>
          <p class="text-sm">{{ r.reason }}</p>
          <p v-for="line in r.items" :key="line.orderItemId" class="text-sm text-muted-foreground">{{ o.items.find((i: any) => i.id === line.orderItemId)?.title }} × {{ line.quantity }}</p>
          <form v-if="user.role === 'ADMIN' && r.state === 'PENDING'" class="space-y-2 border-t pt-3" @submit.prevent="decideReturn(r, true)">
            <Label>سبب قرار الإرجاع</Label><Textarea v-model="returnDecision(r).reason" required minlength="5" maxlength="180" />
            <Label>رد النقدية المعتمد بالقرش</Label><Input v-model.number="returnDecision(r).refundAmount" type="number" min="0" required />
            <label class="flex items-center gap-2 text-sm"><input v-model="returnDecision(r).goodsReceived" type="checkbox" class="size-4 accent-[#ff7a00]" /> تم استلام وفحص البضاعة</label>
            <label class="flex items-center gap-2 text-sm"><input v-model="returnDecision(r).restock" type="checkbox" class="size-4 accent-[#ff7a00]" /> القطع سليمة ويمكن إعادتها للمخزون</label>
            <div class="grid grid-cols-2 gap-3"><Button type="submit" :disabled="busy">اعتماد الإرجاع</Button><Button type="button" variant="outline" :disabled="busy" @click="decideReturn(r, false)">رفض الإرجاع</Button></div>
          </form>
          <p v-else class="text-sm">{{ r.decisionReason }} • {{ money(r.refundAmount) }}</p>
          <form v-if="user.role === 'ADMIN' && r.state === 'APPROVED' && r.refundAmount > 0 && !r.refundedAt" class="space-y-2 border-t pt-3" @submit.prevent="recordRefund(r)">
            <Label>مرجع إثبات رد النقدية</Label><Input v-model="refundForm(r).reference" required minlength="8" maxlength="120" />
            <Label>تفاصيل رد النقدية</Label><Textarea v-model="refundForm(r).note" required minlength="5" maxlength="180" />
            <Button type="submit" class="w-full" :disabled="busy">تسجيل إثبات رد النقدية</Button>
          </form>
          <p v-if="r.refundedAt" class="text-sm">تم تسجيل الإثبات: {{ r.refundReference }} • {{ r.refundNote }}</p>
        </Card>
      </template>
    </div>
  </div>
</template>
