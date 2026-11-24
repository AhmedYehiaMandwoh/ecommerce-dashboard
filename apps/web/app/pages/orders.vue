<script setup lang="ts">
const { busy, cancellationReasons, go, imageUrl, lastPlacedOrder, login, money, orders, requestCancellation, requestReturn, returnForm, status, statusLabels, user, view } = useMarket();
</script>

<template>
  <div>
      <template v-if="view === 'orders'"
        ><section v-if="lastPlacedOrder" class="order-success"><div class="success-ring">✓</div><h1>تم استلام طلبك</h1><strong>طلب تجريبي</strong><p>رقم الطلب: <b dir="ltr">{{ lastPlacedOrder.id.slice(0,8) }}</b></p><div class="alert">لا يوجد دفع ولا توصيل حقيقي. لا تحتاج لدفع أي مبلغ.</div><p>{{ lastPlacedOrder.orders?.length || 1 }} طلب محل • {{ money(lastPlacedOrder.total) }}</p><div class="row"><button class="orange" @click="lastPlacedOrder=null">تابع الطلب</button><button class="alt" @click="lastPlacedOrder=null;go('home')">الرئيسية</button></div></section><h1>طلباتي</h1>
        <div v-if="!user" class="empty">
          <button @click="go('login')">سجّل الدخول لعرض الطلبات</button>
        </div>
        <div v-else-if="!orders.length" class="empty">لسه مفيش طلبات.</div>
        <div v-for="o in orders" :key="o.id" class="card section-gap">
          <div class="row between">
            <h3>طلب #{{ o.id.slice(0, 8) }}</h3>
            <span class="badge">{{ statusLabels[o.status] }}</span>
          </div>
          <p>{{ o.shop.name }} • {{ money(o.total) }}</p>
          <p class="muted">
            {{ new Date(o.createdAt).toLocaleString("ar-EG") }} • طلب تجريبي
          </p>
          <div v-for="i in o.items" :key="i.id" class="customer-order-line"><img v-if="i.offer?.product?.image" :src="imageUrl(i.offer.product.image)" alt=""/><div><strong>{{ i.title }}</strong><small>الكمية: {{ i.quantity }} • {{ i.partNumber }}</small><b>{{ money(i.unitPrice * i.quantity) }}</b></div></div>
          <div class="order-progress"><div v-for="stage in ['PLACED','ACCEPTED','PREPARING','SHIPPED','DELIVERED']" :key="stage" :class="{reached:o.events.some((e:any)=>e.status===stage)}"><i>✓</i><span>{{ statusLabels[stage] }}</span></div></div><p v-if="o.status==='CANCELLED'" class="badge">الطلب ملغي</p><small class="muted">سجل حالة من الخادم، ليس تتبع موقع شحنة.</small>
          <form v-if="o.status==='DELIVERED' && !o.settlementFrozen" class="form section-gap" @submit.prevent="requestReturn(o)"><h3>طلب إرجاع للمراجعة</h3><p class="muted">لا توجد سياسة قبول أو مدة تلقائية محددة في نسخة الاختبار. الإدارة تراجع الطلب قبل أي تعديل أو رد نقدية.</p><label v-for="i in o.items" :key="i.id">كمية إرجاع: {{ i.title }}<input type="number" v-model.number="returnForm(o).items[i.id]" min="0" :max="i.quantity"/></label><label>سبب الإرجاع<textarea v-model="returnForm(o).reason" required minlength="5" maxlength="180"/></label><button class="alt" :disabled="busy">إرسال طلب إرجاع</button></form><div v-for="r in o.returns" :key="r.id" class="alert"><strong>طلب إرجاع: {{ r.state==='PENDING'?'قيد المراجعة':r.state==='APPROVED'?'مقبول':'مرفوض' }}</strong><p>{{ r.reason }} • {{ r.decisionReason }}</p><p v-if="r.state==='APPROVED'">رد نقدية معتمد: {{ money(r.refundAmount) }} • {{ r.refundedAt?'تم تسجيل إثبات الرد':'بانتظار إثبات الرد' }}</p></div>
          <button
            v-if="['PLACED','ACCEPTED','PREPARING'].includes(o.status) && !o.settlementFrozen"
            class="danger section-gap"
            @click="status(o.id, 'CANCELLED')"
          >
            إلغاء الطلب
          </button><div v-if="o.settlementFrozen" class="alert">طلب الإلغاء قيد مراجعة الإدارة. التسوية المالية المتأثرة مجمدة.</div><form v-if="o.status==='SHIPPED' && !o.settlementFrozen" class="section-gap" @submit.prevent="requestCancellation(o)"><label>سبب طلب الإلغاء<textarea v-model="cancellationReasons[o.id]" required minlength="5" maxlength="180"/></label><button class="alt" :disabled="busy">إرسال طلب إلغاء للإدارة</button><p class="muted">بدء التوصيل لا يمكن إلغاؤه مباشرة. لن تتغير المبالغ قبل قرار الإدارة.</p></form><div v-for="r in o.cancellationReviews" :key="r.id" class="review-history"><small>طلب إلغاء: {{ r.reason }}</small><p>{{ r.state==='PENDING'?'قيد المراجعة':r.state==='APPROVED'?'تمت الموافقة':'تم الرفض' }} • {{ r.decisionReason }}</p></div>
        </div></template
      >
  </div>
</template>
