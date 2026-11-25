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
<style scoped>
.reference-home{max-width:804px;margin:auto;background:#fff;color:#102035;min-height:100vh;font-family:Cairo,Arial,sans-serif}.reference-home button{padding:0;border-radius:0;background:none;color:inherit}.reference-blue{background:#0649e7}.reference-top{display:flex;align-items:center;justify-content:space-between;height:clamp(48px,12vw,96px);padding:0 4%;direction:inherit}.reference-logo{width:23%;height:94%;object-fit:contain;order:2}.reference-cart{order:1;position:relative;width:8%;color:white!important}.reference-cart svg{width:100%;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.reference-cart span{position:absolute;top:0;right:0;background:#ff751a;border-radius:50%;font-size:9px;min-width:14px}.reference-location{order:3;display:flex;align-items:center;gap:6px;font-size:clamp(9px,2.7vw,22px);direction:ltr;color:#fff!important}.reference-location svg{width:clamp(12px,3.5vw,28px);fill:#fff}.reference-location circle{fill:#0654e8}.reference-search{margin:0 3.5%;display:flex;background:white;border-radius:40px;height:clamp(32px,8vw,65px);overflow:hidden;align-items:center}.reference-search input{width:100%;min-width:0;border:0;background:none;padding:0 5%;outline:none;font-size:clamp(12px,3vw,26px)}.reference-search button{width:10%;margin-left:3%;color:#888}.reference-search svg{width:70%;fill:none;stroke:currentColor;stroke-width:2}.reference-hero{width:100%;display:block}.reference-hero img{width:100%;display:block}.reference-content{padding:1.7% 3.1% 0}.reference-categories{display:grid;grid-template-columns:repeat(5,1fr);gap:2%;margin-bottom:2.6%}.reference-categories img{width:100%;aspect-ratio:1/.99;object-fit:cover;border-radius:16%;display:block}.reference-categories strong{display:block;font-size:clamp(10px,2.6vw,22px);padding-top:1%}.reference-vehicle{background:linear-gradient(90deg,#edf4fe,#e8f1ff)!important;width:100%;display:flex;align-items:center;border-radius:20px!important;padding:1.6% 4%!important;gap:5%;direction:ltr;text-align:left;margin-bottom:1.6%}.reference-vehicle img{width:9%}.reference-vehicle span{border-left:1px solid #c5d7ed;padding-left:4%;flex:1;direction:inherit;text-align:left}.reference-vehicle strong{display:block;font-size:clamp(13px,3vw,25px)}.reference-vehicle small{font-size:clamp(10px,2.4vw,20px);color:#777}.reference-vehicle b{font-size:clamp(18px,3vw,28px)}.reference-promos{display:grid;grid-template-columns:1fr 1fr;gap:1.7%;margin-bottom:1.8%}.reference-promos img{width:100%;display:block;border-radius:18px}.reference-section-title{display:flex;align-items:center;justify-content:space-between;margin:0 0 1.4%}.reference-section-title h2{font-size:clamp(17px,3.7vw,31px);margin:0}.reference-section-title button{color:#0053ff;font-size:clamp(13px,2.8vw,24px)}.reference-shops{display:grid;grid-template-columns:1fr 1fr;gap:2%}.reference-shops>button{border:1px solid #eee;border-radius:14px;overflow:hidden;box-shadow:0 3px 7px #0000000c;text-align:right}.reference-shops>button>img{width:100%;aspect-ratio:2.35;object-fit:cover;display:block}.reference-shops>button>div{display:flex;align-items:center;gap:3%;padding:3%;direction:ltr}.reference-shops strong{display:block;font-size:clamp(12px,2.6vw,23px);line-height:1.5}.reference-shops small{font-size:clamp(9px,2vw,18px);color:#888;display:block}.reference-shops b{margin-left:auto;font-size:25px;color:#888}.reference-store{background:#ff6e08;border-radius:50%;width:17%;aspect-ratio:1;display:grid;place-items:center}.reference-store svg{width:60%;fill:none;stroke:#fff;stroke-width:2;stroke-linejoin:round}.reference-demo{color:#888;font-size:clamp(7px,1.6vw,14px);text-align:center;margin:1.8% 0 .8%}.reference-bottom{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #eee;box-shadow:0 -2px 5px #00000005;padding:2% 0 1.2%;background:#fff}.reference-bottom button{display:flex;flex-direction:column;align-items:center;gap:2px;color:#888;font-size:clamp(11px,2.6vw,22px)}.reference-bottom svg{width:clamp(23px,4.7vw,38px);height:clamp(23px,4.7vw,38px);fill:none;stroke:currentColor;stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round}.reference-bottom .active{color:#ff640b}.reference-bottom .active svg{fill:#ff640b}.recovered-home{background:#fff}
</style>
<style scoped>
.reference-top{position:relative}.reference-logo{position:absolute;left:50%;transform:translateX(-50%);top:0}.reference-location{margin-right:auto}.reference-top{background:linear-gradient(110deg,#0755eb,#0044de)}.reference-home{min-height:0}.reference-search{position:relative;z-index:1}.reference-vehicle{padding-top:1.3%!important;padding-bottom:1.3%!important}.reference-vehicle strong{line-height:1.4}.reference-vehicle small{line-height:1.5}
</style>

<style scoped>
.reference-hero{position:relative;aspect-ratio:804/260;background:radial-gradient(ellipse at 60% 90%,#008aff 0%,transparent 48%),linear-gradient(140deg,#0041c5,#0052ff 70%,#1737b5);overflow:hidden;border-radius:0 0 47% 5% / 0 0 7% 4%;color:white;direction:ltr}.reference-hero:before{content:'';position:absolute;right:-3%;bottom:8%;width:60%;height:7%;background:#ff781f;transform:rotate(-13deg)}.reference-hero>img{position:absolute;width:51%;height:98%;object-fit:contain;right:6%;bottom:0}.hero-live-copy{position:relative;z-index:1;width:45%;text-align:center;padding-top:3%;direction:inherit}.hero-live-copy h1{font-size:clamp(24px,5.6vw,46px);line-height:1.15;margin:0 0 3%;font-weight:900;color:white}.hero-live-copy>strong{display:inline-block;font-size:clamp(20px,5vw,41px);line-height:1.2;background:#ff7217;padding:0 5%;transform:rotate(-3deg);white-space:nowrap}.hero-live-copy p{font-size:clamp(10px,2.5vw,21px);line-height:1.5;white-space:nowrap;margin:4% 0 0}.hero-quality{position:absolute;right:3%;top:20%;font-size:clamp(10px,2.5vw,21px);line-height:1.1;opacity:.65;font-weight:900;transform:rotate(-10deg)}
.reference-promos .promo-live{position:relative;aspect-ratio:371/244;border-radius:18px;overflow:hidden;text-align:left;direction:ltr}.maintenance-live{background:repeating-linear-gradient(125deg,#ffb58f55 0 12px,transparent 12px 60px),linear-gradient(120deg,#ffd0b4,#ffad7d)!important;color:#4c210a!important}.braking-live{background:repeating-linear-gradient(125deg,#bda2ff66 0 12px,transparent 12px 60px),linear-gradient(120deg,#eee3ff,#b69aff)!important;color:#231061!important}.reference-promos .promo-live>img{position:absolute;right:0;bottom:0;width:59%;height:98%;object-fit:contain;border-radius:0}.promo-copy{position:absolute;left:5%;top:7%;z-index:1;direction:inherit;text-align:left}.promo-copy strong{font-weight:900;font-size:clamp(21px,5vw,42px);line-height:1.1;display:block}.promo-copy small{font-size:clamp(10px,2.5vw,21px);display:block;margin-top:8%;white-space:nowrap}.promo-cta{position:absolute;bottom:7%;left:4%;background:#ff6d08;color:white;border-radius:40px;font-size:clamp(10px,2.7vw,22px);font-weight:900;line-height:1.3;padding:3% 5%;z-index:2;white-space:nowrap}
@media(max-width:500px){.reference-top{height:68px}.reference-logo{width:24%;height:65%;top:13%}.reference-location{font-size:11px;gap:3px}.reference-location svg{width:13px}.reference-cart{width:9%}.reference-search{height:41px}.reference-search input{font-size:15px}.reference-categories strong{font-size:12px}.reference-categories{gap:1.5%;margin-top:1%}.reference-vehicle{padding:3% 4%!important}.reference-vehicle strong{font-size:17px}.reference-vehicle small{font-size:12px}.reference-shops strong{font-size:14px}.reference-shops small{font-size:12px}.reference-shops>button>div{gap:3%;padding:5%}.reference-bottom button{font-size:13px}.reference-bottom{padding:3% 0}.reference-bottom svg{width:26px;height:26px}.reference-section-title h2{font-size:20px}.reference-section-title button{font-size:15px}.reference-demo{font-size:10px;line-height:1.6;margin:3% 0}.reference-shops>button>img{aspect-ratio:2}.reference-content{padding-top:2%}}
</style>
<style scoped>
@media(max-width:500px){.hero-live-copy h1{font-size:23px;line-height:1.16}.hero-live-copy>strong{font-size:20px}.hero-live-copy p{font-size:10px}.promo-copy strong{font-size:23px}.promo-copy small{font-size:11px}.promo-cta{font-size:11px}.reference-promos .promo-live{aspect-ratio:371/260}.reference-promos .promo-live>img{width:57%;right:0}.promo-copy{left:5%;top:8%}.reference-location{font-size:12px}.reference-logo{width:23%}}
</style>

<style>
.reference-home .reference-lang{color:#fff;font-weight:800;font-size:14px;padding:6px 10px!important;border:1px solid rgba(255,255,255,.6)!important;border-radius:999px!important}
.reference-links{display:none}
.reference-home nav.reference-links{background:none;padding:0;border:0;box-shadow:none;position:static}
@media(min-width:900px){
 .recovered-home .reference-home{max-width:none;width:100%}
 .reference-home .reference-top{height:84px;padding:0 max(32px,calc((100% - 1400px)/2))}
 .reference-home .reference-logo{width:150px;height:62px;top:11px}
 .reference-home .reference-cart{width:36px}.reference-home .reference-cart span{font-size:11px;min-width:18px}
 .reference-home .reference-location{font-size:16px;gap:8px}.reference-home .reference-location svg{width:20px}
 .reference-home .reference-top{gap:24px}.reference-home .reference-logo{position:static;transform:none;order:2}.reference-home .reference-location{order:4;margin:0;margin-inline-start:auto}.reference-home nav.reference-links{display:flex;gap:28px;order:3;margin-inline-start:32px;position:static}.reference-home .reference-links button{color:#fff!important;font-size:17px;font-weight:700;background:none!important}
 .reference-home .reference-search{height:56px;max-width:760px;margin:0 auto 24px;width:calc(100% - 64px)}.reference-home .reference-search input{font-size:18px}.reference-home .reference-search svg{width:30px}
 .reference-home .reference-blue{padding-bottom:0}
 .reference-home .reference-hero{aspect-ratio:auto;height:clamp(300px,30vw,480px);border-radius:0 0 50% 50%/0 0 12% 12%}
 .reference-home .hero-live-copy{width:46%;padding-top:5%;padding-inline:4%}.reference-home .hero-live-copy h1{font-size:clamp(34px,3.6vw,58px)}.reference-home .hero-live-copy>strong{font-size:clamp(28px,3vw,48px)}.reference-home .hero-live-copy p{font-size:clamp(15px,1.5vw,22px)}
 .reference-home .reference-hero>img{width:46%;right:8%}.reference-home .hero-quality{font-size:22px}
 .reference-home .reference-content{max-width:1400px;margin:0 auto;padding:32px 32px 0}
 .reference-home .reference-categories{max-width:900px;margin:0 auto 32px;gap:20px}.reference-home .reference-categories strong{font-size:18px;padding-top:8px}
 .reference-home .reference-vehicle{max-width:760px;margin:0 auto 28px;padding:16px 28px!important;gap:24px}.reference-home .reference-vehicle img{width:56px}.reference-home .reference-vehicle strong{font-size:20px}.reference-home .reference-vehicle small{font-size:15px}
 .reference-home .reference-promos{gap:24px;margin-bottom:36px}.reference-home .reference-promos .promo-live{aspect-ratio:auto;height:clamp(200px,17vw,280px)}.reference-home .promo-copy strong{font-size:clamp(28px,2.6vw,40px)}.reference-home .promo-copy small{font-size:17px}.reference-home .promo-cta{font-size:17px;padding:10px 22px}
 .reference-home .reference-section-title{margin-bottom:16px}.reference-home .reference-section-title h2{font-size:28px}.reference-home .reference-section-title button{font-size:18px}
 .reference-home .reference-shops{gap:24px}.reference-home .reference-shops strong{font-size:20px}.reference-home .reference-shops small{font-size:15px}.reference-home .reference-shops>button>div{padding:14px 18px}.reference-home .reference-store{width:48px}
 .reference-home .reference-demo{font-size:14px;margin:28px 0}
 .reference-home .reference-bottom{display:none}
}
@media(min-width:1200px){
 .reference-home .reference-content{max-width:1680px;padding:40px 48px 0}
 .reference-home .reference-categories{max-width:none;gap:28px;margin-bottom:40px}.reference-home .reference-categories img{aspect-ratio:1.5;border-radius:22px}.reference-home .reference-categories strong{font-size:22px;padding-top:10px}
 .reference-home .reference-vehicle{max-width:none;margin:0 0 36px;padding:22px 40px!important}.reference-home .reference-vehicle strong{font-size:24px}.reference-home .reference-vehicle img{width:72px}
 .reference-home .reference-promos{gap:32px}.reference-home .reference-promos .promo-live{height:clamp(240px,16vw,360px)}
 .reference-home .reference-shops{grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:28px}.reference-home .reference-shops>button>img{aspect-ratio:2.2}
 .reference-home .reference-search{max-width:880px}
}
@media(min-width:1920px){
 .reference-home .reference-top{padding:0 max(48px,calc((100% - 2240px)/2))}
 .reference-home .reference-content{max-width:2240px;padding:48px 64px 0}
 .reference-home .reference-categories{gap:40px}.reference-home .reference-categories strong{font-size:26px}
 .reference-home .reference-vehicle strong{font-size:28px}
 .reference-home .reference-promos{gap:40px}.reference-home .reference-promos .promo-live{height:clamp(300px,15vw,420px)}
 .reference-home .reference-section-title h2{font-size:34px}.reference-home .reference-section-title button{font-size:22px}
 .reference-home .reference-shops{grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:36px}.reference-home .reference-shops strong{font-size:24px}.reference-home .reference-shops small{font-size:18px}
 .reference-home .reference-search{max-width:1000px;height:64px}.reference-home .reference-search input{font-size:20px}
}
</style>

