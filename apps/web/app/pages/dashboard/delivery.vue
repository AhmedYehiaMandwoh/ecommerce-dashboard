<script setup lang="ts">
const { busy, dash, deliveryArea, money, saveDeliveryArea, user } = useMarket();
</script>

<template>
  <div v-if="user.role === 'ADMIN'" class="grid gap-4 lg:grid-cols-2">
    <Card class="space-y-3 p-5">
      <h2 class="text-lg font-extrabold">مناطق ورسوم التوصيل</h2>
      <p class="text-sm text-muted-foreground">رسوم المنطقة مرة واحدة للسلة. كل محل مسؤول عن التوصيل. تفعيل الطلبات الحقيقية لسه متوقف.</p>
      <form class="space-y-2" @submit.prevent="saveDeliveryArea">
        <Label>المحافظة / المدينة</Label><Input v-model="deliveryArea.city" required minlength="2" maxlength="80" />
        <Label>المنطقة</Label><Input v-model="deliveryArea.area" required minlength="2" maxlength="120" />
        <Label>رسوم المنطقة بالقرش</Label><Input v-model.number="deliveryArea.fee" type="number" min="0" max="10000000" required />
        <label class="flex items-center gap-2 text-sm"><input v-model="deliveryArea.active" type="checkbox" class="size-4 accent-[#ff7a00]" /> متاح للتوصيل</label>
        <Button type="submit" class="w-full" :disabled="busy">حفظ منطقة التوصيل</Button>
      </form>
    </Card>
    <Card class="space-y-2 p-5">
      <h3 class="font-extrabold">المناطق الحالية</h3>
      <div v-for="a in dash.deliveryAreas" :key="a.id" class="flex items-center justify-between gap-2 border-t pt-2 text-sm">
        <span>{{ a.city }} • {{ a.area }}</span><b>{{ money(a.fee) }}</b><Badge :variant="a.active ? 'default' : 'secondary'">{{ a.active ? "نشط" : "متوقف" }}</Badge>
        <Button size="sm" variant="outline" @click="Object.assign(deliveryArea, { city: a.city, area: a.area, fee: a.fee, active: a.active })">تعديل</Button>
      </div>
    </Card>
  </div>
  <p v-else class="text-muted-foreground">هذه الصفحة للإدارة فقط.</p>
</template>
