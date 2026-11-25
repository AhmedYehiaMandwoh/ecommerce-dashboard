<script setup lang="ts">
const { t } = useI18n();
const { busy, dash, deliveryArea, money, saveDeliveryArea, user } = useMarket();
</script>

<template>
  <div v-if="user.role === 'ADMIN'" class="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
    <Card class="space-y-3 p-5">
      <h2 class="text-lg font-extrabold">{{ t('مناطق ورسوم التوصيل') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('رسوم المنطقة مرة واحدة للسلة. كل محل مسؤول عن التوصيل. تفعيل الطلبات الحقيقية لسه متوقف.') }}</p>
      <form class="space-y-2" @submit.prevent="saveDeliveryArea">
        <Label>{{ t('المحافظة / المدينة') }}</Label><Input v-model="deliveryArea.city" required minlength="2" maxlength="80" />
        <Label>{{ t('المنطقة') }}</Label><Input v-model="deliveryArea.area" required minlength="2" maxlength="120" />
        <Label>{{ t('رسوم المنطقة بالقرش') }}</Label><Input v-model.number="deliveryArea.fee" type="number" min="0" max="10000000" required />
        <label class="flex items-center gap-2 text-sm"><input v-model="deliveryArea.active" type="checkbox" class="size-4 accent-[#ff7a00]" /> {{ t('متاح للتوصيل') }}</label>
        <Button type="submit" class="w-full" :disabled="busy">{{ t('حفظ منطقة التوصيل') }}</Button>
      </form>
    </Card>
    <Card class="space-y-2 p-5">
      <h3 class="font-extrabold">{{ t('المناطق الحالية') }}</h3>
      <div v-for="a in dash.deliveryAreas" :key="a.id" class="flex items-center justify-between gap-2 border-t pt-2 text-sm">
        <span>{{ a.city }} • {{ a.area }}</span><b>{{ money(a.fee) }}</b><Badge :variant="a.active ? 'default' : 'secondary'">{{ a.active ? t('نشط') : t('متوقف') }}</Badge>
        <Button size="sm" variant="outline" @click="Object.assign(deliveryArea, { city: a.city, area: a.area, fee: a.fee, active: a.active })">{{ t('تعديل') }}</Button>
      </div>
    </Card>
  </div>
  <p v-else class="text-muted-foreground">{{ t('هذه الصفحة للإدارة فقط.') }}</p>
</template>
