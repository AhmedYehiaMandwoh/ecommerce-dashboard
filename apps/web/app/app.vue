<script setup lang="ts">
const { t, locale, dir, setLocale } = useI18n();
useHead({ htmlAttrs: { lang: locale, dir } });
const { view, cart, user, error, message, busy, go, dashboard, logout } = useMarket();
const route = useRoute();
let setAt = 0;
let timer: any;
watch(message, (m) => {
  clearTimeout(timer);
  if (m) { setAt = Date.now(); timer = setTimeout(() => { message.value = ""; }, 6000); }
});
watch(() => route.path, () => {
  if (message.value && Date.now() - setAt > 800) message.value = "";
});
</script>

<template>
  <div v-if="view === 'dashboard'" class="min-h-screen bg-background text-foreground" :dir="dir"><NuxtPage /></div>
  <div v-else :class="{ 'recovered-home': view === 'home', 'marketplace-shell': view !== 'home' }">
    <NuxtPage v-if="view === 'home'" />
    <div v-if="view !== 'home'" class="bg-[#edf5ff] px-4 py-[5px] text-center text-[11px] text-[#526782] max-[600px]:text-[10px]">
      {{ t('نسخة تطوير • كل المنتجات والأسعار والطلبات للتجربة فقط • الدفع والتوصيل غير مفعّلين') }}
    </div>
    <header v-if="view !== 'home'" class="flex flex-nowrap items-center gap-3 bg-[linear-gradient(120deg,#0042c9,#0658f1)] px-6 py-4 text-white max-[600px]:relative max-[600px]:grid max-[600px]:min-h-[92px] max-[600px]:grid-cols-[1fr_90px_1fr] max-[600px]:items-center max-[600px]:gap-x-[5px] max-[600px]:gap-y-0 max-[600px]:px-3 max-[600px]:py-2">
      <a href="/" class="max-[600px]:col-start-2 max-[600px]:row-start-1 max-[600px]:justify-self-center"><img src="/assets/reference-logo.png" :alt="t('غيار')" class="block h-[52px] w-[100px] object-contain max-[600px]:h-[44px] max-[600px]:w-[86px]" /></a>
      <div class="flex-1 max-[600px]:col-[1/4] max-[600px]:row-start-2 max-[600px]:block max-[600px]:min-w-0 max-[600px]:text-center"><strong class="text-[20px] max-[600px]:text-[17px]">{{ ({shops:t('المحلات ونتائج البحث'),product:t('تفاصيل المنتج'),cart:t('سلة المشتريات'),checkout:t('إتمام الطلب'),orders:t('طلباتي'),profile:t('حسابي'),"join-shop":t('الانضمام كتاجر'),login:t('أهلًا بيك'),dashboard:t('لوحة التحكم')} as Record<string,string>)[view] }}</strong></div>
      <div class="min-[601px]:contents max-[600px]:col-start-1 max-[600px]:row-start-1 max-[600px]:flex max-[600px]:flex-col max-[600px]:items-start max-[600px]:justify-self-start">
      <button v-if="user" class="max-[600px]:bg-transparent max-[600px]:px-[3px] max-[600px]:py-[6px] max-[600px]:text-[11px] max-[600px]:leading-[1.6] max-[600px]:max-w-[100px] max-[600px]:min-h-[34px]" @click="go('profile')">{{ t('أهلًا') }} {{ user.name }}</button
      ><button v-else class="max-[600px]:bg-transparent max-[600px]:px-[3px] max-[600px]:py-[6px] max-[600px]:text-[11px] max-[600px]:leading-[1.6] max-[600px]:max-w-[100px] max-[600px]:min-h-[34px]" @click="go('login')">{{ t('دخول / حساب جديد') }}</button
      ><button class="lang-switch max-[600px]:bg-transparent max-[600px]:px-[3px] max-[600px]:py-[6px] max-[600px]:text-[11px] max-[600px]:leading-[1.6] max-[600px]:max-w-[100px] max-[600px]:min-h-[34px]" @click="setLocale(locale === 'ar' ? 'en' : 'ar')">{{ locale === 'ar' ? 'English' : 'العربية' }}</button
      ></div
      ><button class="max-[600px]:col-start-3 max-[600px]:row-start-1 max-[600px]:min-h-[25px] max-[600px]:max-w-[100px] max-[600px]:justify-self-end max-[600px]:bg-transparent max-[600px]:px-[3px] max-[600px]:py-[6px] max-[600px]:text-[12px] max-[600px]:leading-[1.6]" @click="go('cart')">
        {{ t('السلة ({0})', cart.reduce((s: number, i: any) => s + i.quantity, 0)) }}
      </button>
    </header>
    <nav v-if="view !== 'home'" class="sticky top-0 z-[5] flex flex-wrap justify-start gap-[7px] border-0 bg-white px-[18px] py-1.5 shadow-[0_2px_8px_#1027470b] max-[600px]:justify-between max-[600px]:gap-0 max-[600px]:px-2 max-[600px]:py-[5px]">
      <button :class="[view === 'home' ? 'bg-[#e9f1ff] text-[#0757e9]' : 'bg-transparent text-[#5b6c84]', 'min-h-[44px] max-[600px]:min-h-[35px] max-[600px]:px-[5px] max-[600px]:py-2 max-[600px]:text-[11px]']" @click="go('home')">
        {{ t('الرئيسية') }}</button
      ><button class="bg-transparent text-[#5b6c84] min-h-[44px] max-[600px]:min-h-[35px] max-[600px]:px-[5px] max-[600px]:py-2 max-[600px]:text-[11px]" @click="go('shops')">{{ t('المحلات') }}</button
      ><button class="bg-transparent text-[#5b6c84] min-h-[44px] max-[600px]:min-h-[35px] max-[600px]:px-[5px] max-[600px]:py-2 max-[600px]:text-[11px]" @click="go('orders')">{{ t('طلباتي') }}</button
      ><button class="bg-transparent text-[#5b6c84] min-h-[44px] max-[600px]:min-h-[35px] max-[600px]:px-[5px] max-[600px]:py-2 max-[600px]:text-[11px]" @click="go('profile')">{{ t('عربياتي وعناويني') }}</button
      ><button class="bg-transparent text-[#5b6c84] min-h-[44px] max-[600px]:min-h-[35px] max-[600px]:px-[5px] max-[600px]:py-2 max-[600px]:text-[11px]" v-if="user && user.role !== 'CUSTOMER'" @click="dashboard">
        {{ user.role === "ADMIN" ? t('إدارة المنصة') : t('لوحة التاجر') }}</button
      ><button class="bg-transparent text-[#5b6c84] min-h-[44px] max-[600px]:min-h-[35px] max-[600px]:px-[5px] max-[600px]:py-2 max-[600px]:text-[11px]" v-if="user" @click="logout">{{ t('خروج') }}</button>
    </nav>
    <main v-if="view !== 'home'">
      <div v-if="error" class="error" role="alert">{{ error }}</div>
      <div v-if="message" class="success" role="status">{{ message }}</div>
      <p v-if="busy" class="muted" aria-live="polite">{{ t('جارٍ التحميل...') }}</p>
      <NuxtPage v-if="view !== 'home'" />
    </main>
    <footer class="p-[35px] text-center text-[11px] text-[#8b99ae]" :class="{ hidden: view === 'home' }">
      {{ t('غيار • نسخة تطوير 0.1 • اسم وهوية مبدئية • لا يتم تحصيل أي مبالغ') }}
    </footer>
  </div>
</template>
