<script setup lang="ts">
const { t, locale } = useI18n();
const { busy, cancellationReasons, go, imageUrl, lastPlacedOrder, login, money, orders, requestCancellation, requestReturn, returnForm, status, statusLabels, user, view } = useMarket();
</script>

<template>
  <div>
      <template v-if="view === 'orders'"
        ><section v-if="lastPlacedOrder" class="order-success"><div class="success-ring">✓</div><h1>{{ t('تم استلام طلبك') }}</h1><strong>{{ t('طلب تجريبي') }}</strong><p>{{ t('رقم الطلب:') }} <b dir="ltr">{{ lastPlacedOrder.id.slice(0,8) }}</b></p><div class="alert">{{ t('لا يوجد دفع ولا توصيل حقيقي. لا تحتاج لدفع أي مبلغ.') }}</div><p>{{ lastPlacedOrder.orders?.length || 1 }} {{ t('طلب محل •') }} {{ money(lastPlacedOrder.total) }}</p><div class="row"><button class="orange" @click="lastPlacedOrder=null">{{ t('تابع الطلب') }}</button><button class="alt" @click="lastPlacedOrder=null;go('home')">{{ t('الرئيسية') }}</button></div></section><h1>{{ t('طلباتي') }}</h1>
        <div v-if="!user" class="empty">
          <button @click="go('login')">{{ t('سجّل الدخول لعرض الطلبات') }}</button>
        </div>
        <div v-else-if="!orders.length" class="empty">{{ t('لسه مفيش طلبات.') }}</div>
        <div v-for="o in orders" :key="o.id" class="card section-gap">
          <div class="row between">
            <h3>{{ t('طلب #') }}{{ o.id.slice(0, 8) }}</h3>
            <span class="badge">{{ statusLabels[o.status] }}</span>
          </div>
          <p>{{ o.shop.name }} • {{ money(o.total) }}</p>
          <p class="muted">
            {{ new Date(o.createdAt).toLocaleString(locale === "en" ? "en-GB" : "ar-EG") }} {{ t('• طلب تجريبي') }}
          </p>
          <div v-for="i in o.items" :key="i.id" class="my-3 flex items-center gap-[14px] rounded-[13px] bg-[#f7f9fc] p-3"><img class="h-[75px] w-[85px] rounded-[10px] object-contain" v-if="i.offer?.product?.image" :src="imageUrl(i.offer.product.image)" alt=""/><div><strong>{{ i.title }}</strong><small class="mt-1 block text-[12px] text-[#7a8ba4]">{{ t('الكمية:') }} {{ i.quantity }} • {{ i.partNumber }}</small><b class="mt-1 block text-[#ff6508]">{{ money(i.unitPrice * i.quantity) }}</b></div></div>
          <div class="mt-[15px] flex justify-between gap-1 rounded-[13px] bg-[#f6f9fd] px-[5px] py-3"><div v-for="stage in ['PLACED','ACCEPTED','PREPARING','SHIPPED','DELIVERED']" :key="stage" class="flex flex-1 flex-col items-center gap-[5px] text-[11px]" :class="o.events.some((e:any)=>e.status===stage) ? 'font-bold text-[#0757e9]' : 'text-[#99a5b6]'"><i class="flex size-6 items-center justify-center rounded-[50%] text-white not-italic" :class="o.events.some((e:any)=>e.status===stage) ? 'bg-[#0757e9]' : 'bg-[#e1e8f1]'">✓</i><span>{{ statusLabels[stage] }}</span></div></div><p v-if="o.status==='CANCELLED'" class="badge">{{ t('الطلب ملغي') }}</p><small class="muted">{{ t('سجل حالة من الخادم، ليس تتبع موقع شحنة.') }}</small>
          <form v-if="o.status==='DELIVERED' && !o.settlementFrozen" class="form section-gap" @submit.prevent="requestReturn(o)"><h3>{{ t('طلب إرجاع للمراجعة') }}</h3><p class="muted">{{ t('لا توجد سياسة قبول أو مدة تلقائية محددة في نسخة الاختبار. الإدارة تراجع الطلب قبل أي تعديل أو رد نقدية.') }}</p><label v-for="i in o.items" :key="i.id">{{ t('كمية إرجاع:') }} {{ i.title }}<input type="number" v-model.number="returnForm(o).items[i.id]" min="0" :max="i.quantity"/></label><label>{{ t('سبب الإرجاع') }}<textarea v-model="returnForm(o).reason" required minlength="5" maxlength="180"/></label><button class="alt" :disabled="busy">{{ t('إرسال طلب إرجاع') }}</button></form><div v-for="r in o.returns" :key="r.id" class="alert"><strong>{{ t('طلب إرجاع:') }} {{ r.state==='PENDING'?t('قيد المراجعة'):r.state==='APPROVED'?t('مقبول'):t('مرفوض') }}</strong><p>{{ r.reason }} • {{ r.decisionReason }}</p><p v-if="r.state==='APPROVED'">{{ t('رد نقدية معتمد:') }} {{ money(r.refundAmount) }} • {{ r.refundedAt?t('تم تسجيل إثبات الرد'):t('بانتظار إثبات الرد') }}</p></div>
          <button
            v-if="['PLACED','ACCEPTED','PREPARING'].includes(o.status) && !o.settlementFrozen"
            class="danger section-gap"
            @click="status(o.id, 'CANCELLED')"
          >
            {{ t('إلغاء الطلب') }}
          </button><div v-if="o.settlementFrozen" class="alert">{{ t('طلب الإلغاء قيد مراجعة الإدارة. التسوية المالية المتأثرة مجمدة.') }}</div><form v-if="o.status==='SHIPPED' && !o.settlementFrozen" class="section-gap" @submit.prevent="requestCancellation(o)"><label>{{ t('سبب طلب الإلغاء') }}<textarea v-model="cancellationReasons[o.id]" required minlength="5" maxlength="180"/></label><button class="alt" :disabled="busy">{{ t('إرسال طلب إلغاء للإدارة') }}</button><p class="muted">{{ t('بدء التوصيل لا يمكن إلغاؤه مباشرة. لن تتغير المبالغ قبل قرار الإدارة.') }}</p></form><div v-for="r in o.cancellationReviews" :key="r.id" class="review-history"><small>{{ t('طلب إلغاء:') }} {{ r.reason }}</small><p>{{ r.state==='PENDING'?t('قيد المراجعة'):r.state==='APPROVED'?t('تمت الموافقة'):t('تم الرفض') }} • {{ r.decisionReason }}</p></div>
        </div></template
      >
  </div>
</template>
