<script setup lang="ts">
const { busy, dash, dashboardTab, decideCancellation, decisionForm, expandedOrder, imageUrl, money, next, orders, status, statusLabels, user } = useMarket();
</script>

<template>
  <div>
        <template v-if="dashboardTab === 'overview' || dashboardTab === 'orders'">
        <div class="row between"><h2>{{ dashboardTab === 'overview' ? 'أحدث الطلبات' : 'متابعة الطلبات' }}</h2><button v-if="dashboardTab === 'overview'" class="alt" @click="dashboardTab='orders'">عرض الكل</button></div>
        <div v-if="!dash.orders.length" class="empty">مفيش طلبات لسه.</div>
        <div v-for="o in (dashboardTab === 'overview' ? dash.orders.slice(0,3) : dash.orders)" :key="o.id" class="card section-gap">
          <div class="row between">
            <strong>#{{ o.id.slice(0, 8) }} • {{ o.shop.name }}</strong
            ><span class="badge">{{ statusLabels[o.status] }}</span
            ><b>{{ money(o.total) }}</b>
          </div>
          <div class="merchant-order-preview"><div class="order-parcel"><img :src="imageUrl(o.items[0]?.offer?.product?.image || '/assets/shop-icon.png')" alt=""/></div><div><p v-for="i in o.items" :key="i.id">{{ i.title }} <b>× {{ i.quantity }}</b></p><button class="alt" @click="expandedOrder=expandedOrder===o.id?'':o.id">{{ expandedOrder===o.id?'إخفاء التفاصيل':'تفاصيل الطلب' }}</button></div></div>
          <div v-if="expandedOrder===o.id" class="order-expanded"><h3>عنوان الشحن</h3><p>{{ o.address.city }} • {{ o.address.details }}</p><p dir="ltr">{{ o.address.phone }}</p><h3>حالة الطلب</h3><div class="timeline"><span v-for="e in o.events" :key="e.id" class="done">{{ statusLabels[e.status] }}</span></div><p class="muted">طلب تجريبي. لا دفع ولا شحنة حقيقية.</p></div>
          <p class="muted">
            {{ o.address.city }} • {{ o.address.details }} •
            {{ o.address.phone }}
          </p>
          <div class="order-collection"><p>منتجات: {{ money(o.subtotal) }} • حصة شحن للمنصة: {{ money(o.delivery) }}</p><strong>إجمالي التحصيل عند التسليم: {{ money(o.total) }}</strong><small v-if="o.deliveryStartedAt">بدء التوصيل: {{ new Date(o.deliveryStartedAt).toLocaleString('ar-EG') }}</small></div><div v-if="o.settlementFrozen" class="alert">تسوية مجمدة أثناء مراجعة طلب الإلغاء</div><div v-for="r in o.cancellationReviews?.filter((r:any)=>r.state==='PENDING')" :key="r.id" class="cancellation-review"><h3>طلب إلغاء للمراجعة</h3><p>{{ r.reason }}</p><template v-if="user.role==='ADMIN'"><label>سبب القرار<textarea v-model="decisionForm(r).reason" minlength="5" maxlength="180"/></label><label>شحن محتفظ به بالقرش بعد الإلغاء<input v-model.number="decisionForm(r).shippingRetained" type="number" min="0" :max="o.delivery"/></label><p class="muted">لا يتم تسجيل رد أموال تم فعليًا هنا. قرار الاحتفاظ بالشحن يُسجل، والتحصيل/الرد له إجراء مستقل.</p><div class="row"><button class="danger" :disabled="busy" @click="decideCancellation(r,true)">الموافقة على الإلغاء</button><button class="alt" :disabled="busy" @click="decideCancellation(r,false)">رفض الإلغاء</button></div></template></div>
          <div class="row">
            <button
              v-if="next[o.status]"
              :disabled="busy || o.settlementFrozen"
              @click="status(o.id, next[o.status]!)"
            >
              {{ statusLabels[next[o.status]!] }}</button
            ><button
              v-if="['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status)"
              class="danger"
              @click="status(o.id, 'CANCELLED')"
            >
              إلغاء وإرجاع المخزون
            </button>
          </div>
        </div>
        </template>
  </div>
</template>
