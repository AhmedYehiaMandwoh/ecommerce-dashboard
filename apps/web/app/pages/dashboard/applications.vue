<script setup lang="ts">
const { applicationReasons, busy, dash, dashboardTab, decideShopApplication, user } = useMarket();
</script>

<template>
  <div>
<section v-if="dashboardTab==='applications' && user.role==='ADMIN'"><h2>طلبات انضمام المحلات</h2><p class="muted">راجع بيانات النشاط وتواصل مع مقدم الطلب قبل الموافقة. لا يوجد تحقق آلي من المستندات.</p><div v-for="a in dash.shopApplications" :key="a.id" class="card section-gap"><h3>{{ a.name }} • {{ a.city }}</h3><p>{{ a.address }}</p><p dir="ltr">{{ a.phone }}</p><p>{{ a.details }}</p><span class="badge">{{ a.state }}</span><template v-if="a.state==='PENDING'"><label>سبب قرار الانضمام<textarea v-model="applicationReasons[a.id]" minlength="5" maxlength="180"/></label><div class="row"><button :disabled="busy" @click="decideShopApplication(a,true)">اعتماد وتفعيل المتجر</button><button class="danger" :disabled="busy" @click="decideShopApplication(a,false)">رفض طلب الانضمام</button></div></template><p v-else>{{ a.reviewReason }}</p></div></section>
  </div>
</template>
