<script setup lang="ts">
const { busy, dash, decideCancellation, decisionForm, expandedOrder, imageUrl, money, next, status, statusLabels, user } = useMarket();
</script>

<template>
  <div class="space-y-4">
    <p v-if="!dash.orders.length" class="text-muted-foreground">مفيش طلبات لسه.</p>
    <div class="grid gap-4 lg:grid-cols-2">
      <Card v-for="o in dash.orders" :key="o.id" class="space-y-3 p-5">
        <div class="flex items-center justify-between gap-2"><strong>#{{ o.id.slice(0, 8) }} • {{ o.shop.name }}</strong><Badge>{{ statusLabels[o.status] }}</Badge><b>{{ money(o.total) }}</b></div>
        <div class="flex gap-3">
          <img :src="imageUrl(o.items[0]?.offer?.product?.image || '/assets/shop-icon.png')" alt="" class="size-16 rounded-lg border object-cover" />
          <div class="flex-1 text-sm"><p v-for="i in o.items" :key="i.id">{{ i.title }} <b>× {{ i.quantity }}</b></p>
            <Button size="sm" variant="outline" class="mt-2" @click="expandedOrder = expandedOrder === o.id ? '' : o.id">{{ expandedOrder === o.id ? "إخفاء التفاصيل" : "تفاصيل الطلب" }}</Button></div>
        </div>
        <div v-if="expandedOrder === o.id" class="space-y-1 rounded-lg bg-secondary p-3 text-sm">
          <p class="font-bold">عنوان الشحن</p><p>{{ o.address.city }} • {{ o.address.details }}</p><p dir="ltr">{{ o.address.phone }}</p>
          <p class="font-bold">الحالات</p><div class="flex flex-wrap gap-1"><Badge v-for="e in o.events" :key="e.id" variant="secondary">{{ statusLabels[e.status] }}</Badge></div>
          <p v-if="o.trackingNumber" class="text-xs">رقم الشحنة: <span dir="ltr">{{ o.trackingNumber }}</span></p>
          <p class="text-xs text-muted-foreground">طلب تجريبي. لا دفع ولا شحنة حقيقية.</p>
        </div>
        <p class="text-sm text-muted-foreground">منتجات: {{ money(o.subtotal) }} • حصة شحن للمنصة: {{ money(o.delivery) }} • الإجمالي عند التسليم: <b>{{ money(o.total) }}</b></p>
        <p v-if="o.settlementFrozen" class="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">تسوية مجمدة أثناء مراجعة طلب الإلغاء</p>
        <div v-for="r in o.cancellationReviews?.filter((r: any) => r.state === 'PENDING')" :key="r.id" class="space-y-2 rounded-lg border p-3">
          <h3 class="font-bold">طلب إلغاء للمراجعة</h3><p class="text-sm">{{ r.reason }}</p>
          <template v-if="user.role === 'ADMIN'">
            <Label>سبب القرار</Label><Textarea v-model="decisionForm(r).reason" minlength="5" maxlength="180" />
            <Label>شحن محتفظ به بالقرش بعد الإلغاء</Label><Input v-model.number="decisionForm(r).shippingRetained" type="number" min="0" :max="o.delivery" />
            <p class="text-xs text-muted-foreground">لا يتم تسجيل رد أموال تم فعليًا هنا. قرار الاحتفاظ بالشحن يُسجل، والتحصيل/الرد له إجراء مستقل.</p>
            <div class="grid grid-cols-2 gap-3"><Button variant="destructive" :disabled="busy" @click="decideCancellation(r, true)">الموافقة على الإلغاء</Button><Button variant="outline" :disabled="busy" @click="decideCancellation(r, false)">رفض الإلغاء</Button></div>
          </template>
        </div>
        <div class="flex gap-2">
          <Button v-if="next[o.status]" :disabled="busy || o.settlementFrozen" @click="status(o.id, next[o.status]!)">{{ statusLabels[next[o.status]!] }}</Button>
          <Button v-if="['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status)" variant="destructive" @click="status(o.id, 'CANCELLED')">إلغاء وإرجاع المخزون</Button>
        </div>
      </Card>
    </div>
  </div>
</template>
