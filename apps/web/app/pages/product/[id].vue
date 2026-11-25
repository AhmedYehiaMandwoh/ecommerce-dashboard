<script setup lang="ts">
const { t } = useI18n();
const { api, run, add, detail, go, imageUrl, load, login, money, shopFilter, shops, toggleFavorite, user, vehicle, view } = useMarket();
const route = useRoute();
onMounted(async () => {
  const id = String(route.params.id);
  if (!detail.value || detail.value.id !== id) {
    await run(async () => {
      detail.value = await api("/products/" + id);
    });
  }
});
</script>

<template>
  <div>
      <template v-if="view === 'product' && detail"
        ><button class="alt" @click="go('home')">{{ t('← رجوع للمنتجات') }}</button>
        <div class="two section-gap product-detail-layout">
          <div class="card product-information">
            <img class="detail-img" :src="imageUrl(detail.image)" :alt="detail.title" /><button class="alt" @click="toggleFavorite(detail)">{{ t('حفظ / إزالة من المفضلة') }}</button>
            <p class="muted">{{ detail.brand }} • {{ detail.partNumber }}</p>
            <h1>{{ detail.title }}</h1>
            <div class="product-primary-offer" v-if="detail.offers[0]"><p class="price">{{ money(detail.offers[0].price) }}</p><button class="orange" :disabled="!detail.offers[0].stock" @click="add(detail,detail.offers[0])">{{ detail.offers[0].stock?t('أضف للسلة'):t('غير متوفر') }}</button></div>
            <button class="product-shop-link" v-if="detail.offers[0]" @click="shopFilter=detail.offers[0].shopId;go('shops');load()"><img src="/assets/shop-icon.png" alt=""/><span>{{ detail.offers[0].shop.name }}<small>{{ t('قطع غيار وصيانة') }}</small></span><b>‹</b></button>
            <div class="vehicle-compatibility"><strong>{{ t('هل القطعة مناسبة لعربيتك؟') }}</strong><small>{{ t('راجع رقم القطعة والمحرك مع البائع') }}</small><button class="alt" @click="go(user?'profile':'login')">{{ t('اختار عربيتك') }}</button></div>
            <h3>{{ t('تفاصيل القطعة') }}</h3><p>{{ detail.description }}</p>
            <div class="alert">
              {{ t('التوافق غير مؤكد إلا للبيانات المراجعة أدناه. تشابه شكل القطعة لا يكفي.') }}
            </div>
            <p v-if="!detail.fitments.length" class="muted">
              {{ t('لا توجد بيانات توافق مراجعة لهذا المنتج التجريبي.') }}
            </p>
            <p v-for="f in detail.fitments" :key="f.id">
              {{ f.make }} {{ f.model }} {{ f.fromYear }}-{{ f.toYear }} •
              {{ f.engine }}
            </p>
          </div>
          <div>
            <h2>{{ t('اختار عرض المحل') }}</h2>
            <div
              v-for="o in detail.offers"
              :key="o.id"
              class="card section-gap"
            >
              <h3>{{ o.shop.name }}</h3>
              <p class="muted">{{ o.shop.city }} {{ t('• متاح') }} {{ o.stock }} {{ t('قطعة') }}</p>
              <p class="price">{{ money(o.price) }}</p>
              <button
                class="orange"
                :disabled="o.stock < 1"
                @click="add(detail, o)"
              >
                {{ o.stock ? t('أضف للسلة') : t('غير متوفر') }}
              </button>
            </div>
          </div>
        </div></template
      >
  </div>
</template>
