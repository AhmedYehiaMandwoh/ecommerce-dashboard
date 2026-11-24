<script setup lang="ts">
const { busy, dash, dashboardTab, deliveryArea, money, saveDeliveryArea, user } = useMarket();
</script>

<template>
  <div>
        <section v-if="dashboardTab==='delivery' && user.role==='ADMIN'" class="card"><h2>مناطق ورسوم التوصيل</h2><p class="muted">رسوم المنطقة مرة واحدة للسلة. كل محل مسؤول عن التوصيل. تفعيل الطلبات الحقيقية لسه متوقف.</p><form class="form" @submit.prevent="saveDeliveryArea"><label>المحافظة / المدينة<input v-model="deliveryArea.city" required minlength="2" maxlength="80"/></label><label>المنطقة<input v-model="deliveryArea.area" required minlength="2" maxlength="120"/></label><label>رسوم المنطقة بالقرش<input v-model.number="deliveryArea.fee" type="number" min="0" max="10000000" required/></label><label><input v-model="deliveryArea.active" type="checkbox"/> متاح للتوصيل</label><button :disabled="busy">حفظ منطقة التوصيل</button></form><div v-for="a in dash.deliveryAreas" :key="a.id" class="line row between"><span>{{ a.city }} • {{ a.area }}</span><b>{{ money(a.fee) }}</b><span>{{ a.active?'نشط':'متوقف' }}</span><button class="alt" @click="Object.assign(deliveryArea,{city:a.city,area:a.area,fee:a.fee,active:a.active})">تعديل</button></div></section>
  </div>
</template>
