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
    <div v-if="view !== 'home'" class="notice">
      {{ t('نسخة تطوير • كل المنتجات والأسعار والطلبات للتجربة فقط • الدفع والتوصيل غير مفعّلين') }}
    </div>
    <header v-if="view !== 'home'">
      <a href="/" class="brand"><img src="/assets/reference-logo.png" :alt="t('غيار')" /></a>
      <div class="top"><strong>{{ ({shops:t('المحلات ونتائج البحث'),product:t('تفاصيل المنتج'),cart:t('سلة المشتريات'),checkout:t('إتمام الطلب'),orders:t('طلباتي'),profile:t('حسابي'),"join-shop":t('الانضمام كتاجر'),login:t('أهلًا بيك'),dashboard:t('لوحة التحكم')} as Record<string,string>)[view] }}</strong></div>
      <button v-if="user" @click="go('profile')">{{ t('أهلًا') }} {{ user.name }}</button
      ><button v-else @click="go('login')">{{ t('دخول / حساب جديد') }}</button
      ><button class="lang-switch" @click="setLocale(locale === 'ar' ? 'en' : 'ar')">{{ locale === 'ar' ? 'English' : 'العربية' }}</button
      ><button @click="go('cart')">
        {{ t('السلة ({0})', cart.reduce((s: number, i: any) => s + i.quantity, 0)) }}
      </button>
    </header>
    <nav v-if="view !== 'home'">
      <button :class="{ on: view === 'home' }" @click="go('home')">
        {{ t('الرئيسية') }}</button
      ><button @click="go('shops')">{{ t('المحلات') }}</button
      ><button @click="go('orders')">{{ t('طلباتي') }}</button
      ><button @click="go('profile')">{{ t('عربياتي وعناويني') }}</button
      ><button v-if="user && user.role !== 'CUSTOMER'" @click="dashboard">
        {{ user.role === "ADMIN" ? t('إدارة المنصة') : t('لوحة التاجر') }}</button
      ><button v-if="user" @click="logout">{{ t('خروج') }}</button>
    </nav>
    <main v-if="view !== 'home'">
      <div v-if="error" class="error" role="alert">{{ error }}</div>
      <div v-if="message" class="success" role="status">{{ message }}</div>
      <p v-if="busy" class="muted" aria-live="polite">{{ t('جارٍ التحميل...') }}</p>
      <NuxtPage v-if="view !== 'home'" />
    </main>
    <footer>
      {{ t('غيار • نسخة تطوير 0.1 • اسم وهوية مبدئية • لا يتم تحصيل أي مبالغ') }}
    </footer>
  </div>
</template>
