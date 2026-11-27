<script setup lang="ts">
const { t, dir, locale, setLocale } = useI18n();
const props = defineProps<{ shops: any[]; cartCount: number }>();
const shopCount = computed(() => (props.shops.length > 2 ? Math.min(props.shops.length, 4) : 2));
const emit = defineEmits(['navigate', 'search', 'category']);
const query = ref('');
const items = [
 { label: t('فرامل'), category: t('فرامل'), image: 'brakes' },
 { label: t('زيوت'), category: t('زيوت'), image: 'oil' },
 { label: t('فلاتر'), category: t('فلاتر'), image: 'filter' },
 { label: t('عفشة'), category: t('تعليق'), image: 'suspension' },
 { label: t('إكسسوارات'), category: '', image: 'accessory' },
];
</script>
<template>
 <div class="reference-home" :dir="dir">
  <div class="reference-blue">
   <div class="reference-top">
    <nav class="reference-links" :aria-label="t('روابط الموقع')"><button v-for="l in [['shops',t('المحلات')],['orders',t('طلباتي')],['profile',t('حسابي')]]" :key="l[0]" @click="emit('navigate',l[0])">{{ l[1] }}</button></nav>
    <button class="reference-lang" @click="setLocale(locale === 'ar' ? 'en' : 'ar')">{{ locale === 'ar' ? 'English' : 'العربية' }}</button>
    <button class="reference-cart" :aria-label="t('السلة')" @click="emit('navigate','cart')"><svg viewBox="0 0 40 40"><path d="M4 6h6l5 22h18l5-17H12M17 35h.1M31 35h.1"/></svg><span>{{ cartCount }}</span></button>
    <img class="reference-logo" src="/assets/reference-logo.png" :alt="t('غيار')" />
    <button class="reference-location" @click="emit('navigate','profile')"><svg viewBox="0 0 24 32"><path d="M12 30S1 17 1 12a11 11 0 0 1 22 0c0 5-11 18-11 18Z"/><circle cx="12" cy="11" r="4"/></svg><span>{{ t('حدد موقع التوصيل') }}</span><b>⌄</b></button>
   </div>
   <form class="reference-search" @submit.prevent="emit('search',query)"><input v-model="query" :placeholder="t('ابحث باسم القطعة أو رقمها')" :aria-label="t('البحث باسم أو رقم القطعة')"/><button :aria-label="t('بحث')"><svg viewBox="0 0 28 28"><circle cx="11" cy="11" r="8"/><path d="m17 17 8 8"/></svg></button></form>
   <section class="reference-hero"><div class="hero-live-copy"><h1>{{ t('كل اللي عربيتك') }}<br/>{{ t('محتاجاه') }}</h1><strong>{{ t('في مكان واحد') }}</strong><p>{{ t('من محلات كتير.. اختار الأنسب') }}</p></div><img src="/assets/hero-parts.png" :alt="t('فرامل وزيت وفلاتر وبوجيهات، صور توضيحية')"/><span class="hero-quality">{{ t('جودة') }}<br/>{{ t('اختيار') }}<br/>{{ t('ثقة') }}</span></section>
  </div>
  <div class="reference-content">
   <div class="reference-categories"><button v-for="item in items" :key="item.label" @click="emit('category',item.category)"><img :src="'/assets/category-'+item.image+'.png'" :alt="item.label"/><strong>{{ item.label }}</strong></button></div>
   <button class="reference-vehicle" @click="emit('navigate','profile')"><img src="/assets/car-icon.png" alt=""/><span><strong>{{ t('اختار عربيتك') }}</strong><small>{{ t('عشان توصل للقطعة المناسبة') }}</small></span><b>❯</b></button>
   <div class="reference-promos"><button class="promo-live braking-live" @click="emit('category',t('فرامل'))"><img src="/assets/braking-parts.png" :alt="t('فرامل توضيحية')"/><span class="promo-copy"><strong>{{ t('فرامل') }}<br/>{{ t('وأمان') }}</strong><small>{{ t('لقيادة أكثر أمانًا') }}</small></span><span class="promo-cta">{{ t('شوف الاختيارات ❯') }}</span></button><button class="promo-live maintenance-live" @click="emit('category',t('فلاتر'))"><img src="/assets/maintenance-parts.png" :alt="t('زيت وفلاتر توضيحية')"/><span class="promo-copy"><strong>{{ t('وقت') }}<br/>{{ t('الصيانة؟') }}</strong><small>{{ t('جهز عربيتك') }}</small></span><span class="promo-cta">{{ t('جهز عربيتك ❯') }}</span></button></div>
   <div class="reference-section-title"><h2>{{ t('اكتشف المحلات') }}</h2><button @click="emit('navigate','shops')">{{ t('عرض الكل') }}<i class="chv"></i></button></div>
   <div class="reference-shops"><button v-for="n in shopCount" :key="n" @click="emit('navigate','shops')"><img :src="'/assets/shop-demo-'+(((n-1)%2)+1)+'.png'" :alt="t('تصور توضيحي لمحل قطع غيار')"/><div><span class="reference-store"><svg viewBox="0 0 32 32"><path d="M5 12v16h22V12M3 12l3-9h20l3 9M3 12q3 7 7 0 3 7 6 0 3 7 6 0 4 7 7 0M13 28V18h7v10"/></svg></span><span><strong>{{ shops[n-1]?.name || (n === 1 ? t('أوتو بارتس') : t('متجر النور')) }}</strong><small>{{ t('قطع غيار وصيانة') }}</small></span><b>‹</b></div></button></div>
   <p class="reference-demo">{{ t('تصور مبدئي · صور ومحلات توضيحية · الطلب والدفع للتجربة فقط') }}</p>
  </div>
  <div class="reference-bottom"><button v-for="(entry,n) in [['home',t('الرئيسية')],['shops',t('المحلات')],['orders',t('طلباتي')],['profile',t('حسابي')]]" :key="entry[0]" :class="{active:n===0}" @click="emit('navigate',entry[0])"><svg viewBox="0 0 32 32"><path v-if="n===0" d="m3 15 13-12 13 12-4 1v13h-7v-9h-4v9H7V16Z"/><path v-else-if="n===1" d="M5 12v17h22V12M3 12l3-9h20l3 9M3 12q4 7 9 0 4 7 8 0 5 7 9 0M13 29v-9h7v9"/><path v-else-if="n===2" d="M7 3h19v26l-4-2-4 2-4-2-4 2-3-2ZM11 9h11M11 14h11M11 19h7"/><path v-else d="M5 29q0-13 11-13t11 13ZM22 8a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"/></svg><span>{{ entry[1] }}</span></button></div>
 </div>
</template>
