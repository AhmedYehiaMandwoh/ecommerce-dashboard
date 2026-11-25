<script setup lang="ts">
const { t } = useI18n();
const { addresses, busy, cart, deliveryAreas, deliveryQuote, go, imageUrl, login, money, note, requestKey, reviewDeliveryQuote, selectedAddress, selectedDeliveryArea, shops, submitOrder, total, user, view } = useMarket();
</script>

<template>
  <div>
      <template v-if="view === 'cart' || view === 'checkout'"
        ><h1>{{ view === "cart" ? t('سلة المشتريات') : t('إتمام طلب تجريبي') }}</h1>
        <div v-if="!cart.length" class="empty">
          {{ t('السلة فاضية.') }} <button @click="go('home')">{{ t('اختار قطعك') }}</button>
        </div>
        <div v-else class="two">
          <div class="card cart-lines">
            <button class="cart-shop" @click="go('shops')"><img src="/assets/shop-icon.png" alt=""/><span>{{ new Set(cart.map((i: any)=>i.shopId)).size>1 ? t('سلة من {0} محلات', new Set(cart.map((i: any)=>i.shopId)).size) : (cart[0]?.shopName || t('منتجات المحل')) }}<small>{{ t('راجع رقم القطعة والتوافق مع البائع') }}</small></span><b>‹</b></button>
            <div v-for="(i, n) in cart" :key="i.offerId" class="cart-item line">
              <img :src="imageUrl(i.image)" :alt="i.title" />
              <div style="flex: 1">
                <h3>{{ i.title }}</h3>
                <p class="muted">{{ i.shopName }} • {{ i.partNumber }}</p>
                <span class="cart-line-price">{{ money(i.price) }}</span>
              </div>
              <div class="quantity-control"><button class="quantity-minus" :disabled="i.quantity<=1" @click="i.quantity--; requestKey=''" :aria-label="t('تقليل الكمية')">−</button><input class="qty" v-model.number="i.quantity" type="number" min="1" :max="Math.min(100,i.stock)" :aria-label="t('الكمية')" @change="requestKey=''"/><button :disabled="i.quantity>=Math.min(100,i.stock)" @click="i.quantity++; requestKey=''" :aria-label="t('زيادة الكمية')">+</button></div><button
                class="danger"
                @click="
                  cart.splice(n, 1);
                  requestKey = '';
                "
              >
                {{ t('حذف') }}
              </button>
            </div>
            <template v-if="view === 'checkout'"
              ><h2>{{ t('عنوان التوصيل') }}</h2>
              <select v-model="selectedAddress">
                <option value="">{{ t('اختار عنوان') }}</option>
                <option v-for="a in addresses" :key="a.id" :value="a.id">
                  {{ a.label }} • {{ a.city }} • {{ a.details }}
                </option></select
              ><div v-if="deliveryAreas.length" class="delivery-quote-selection"><label>{{ t('منطقة التوصيل') }}<select v-model="selectedDeliveryArea" :aria-label="t('منطقة التوصيل')"><option value="">{{ t('اختار منطقة التوصيل') }}</option><option v-for="a in deliveryAreas.filter((x: any)=>{const ad=addresses.find((y: any)=>y.id===selectedAddress);return !ad||x.city===ad.city})" :key="a.id" :value="a.id">{{ a.city }} • {{ a.area }} • {{ money(a.fee) }}</option></select></label><button class="alt" :disabled="!selectedAddress||!selectedDeliveryArea||busy" @click="reviewDeliveryQuote">{{ t('راجع التكلفة النهائية') }}</button><p v-if="deliveryQuote">{{ t('رسوم المنطقة للسلة كلها:') }} {{ money(deliveryQuote.delivery) }} {{ t('• الإجمالي:') }} {{ money(deliveryQuote.total) }}</p></div><button
                class="alt section-gap"
                @click="go(user ? 'profile' : 'login')"
              >
                {{ user ? t('إضافة عنوان') : t('سجّل الدخول أولًا') }}</button
              ><label>{{ t('ملاحظة') }}<textarea v-model="note" maxlength="500" /></label>
              <p class="alert">
                {{ t('طلب اختبار فقط. لا دفع ولا توصيل فعلي. رسوم التوصيل الموضحة افتراضية وليست سياسة بيع.') }}
              </p></template
            >
          </div>
          <aside class="card" style="align-self: start">
            <h2>{{ t('ملخص الطلب') }}</h2>
            <p class="row between">
              <span>{{ t('المنتجات') }}</span><b>{{ money(total) }}</b>
            </p>
            <p class="row between">
              <span>{{ deliveryQuote?t('رسوم منطقة التوصيل'):t('توصيل افتراضي للتجربة') }}</span><b>{{ money(deliveryQuote?.delivery ?? 5000) }}</b>
            </p>
            <hr />
            <p class="row between">
              <span>{{ t('الإجمالي التقديري') }}</span
              ><b class="price">{{ money(deliveryQuote?.total ?? total + 5000) }}</b>
            </p>
            <div v-if="deliveryQuote" class="quote-breakdown"><p v-for="g in deliveryQuote.groups" :key="g.shopId">{{ shops.find((s: any)=>s.id===g.shopId)?.name || t('محل') }}{{ t(': منتجات') }} {{ money(g.subtotal) }} {{ t('+ حصة الشحن') }} {{ money(g.delivery) }} = {{ money(g.total) }}</p></div><p class="muted">{{ t('كل محل يوصّل منتجاته ويحصّل حصته الموضحة فقط. مجموع حصص الشحن يساوي رسوم المنطقة مرة واحدة. الخادم يراجع السعر والمخزون عند التأكيد.') }}</p>
            <button
              v-if="view === 'cart'"
              class="orange"
              @click="go(user ? 'checkout' : 'login')"
            >
              {{ t('كمّل الطلب') }}</button
            ><button
              v-else
              class="orange"
              :disabled="busy || !selectedAddress || !deliveryQuote"
              @click="submitOrder"
            >
              {{ t('تأكيد الطلب التجريبي') }}
            </button>
          </aside>
        </div></template
      >
  </div>
</template>
