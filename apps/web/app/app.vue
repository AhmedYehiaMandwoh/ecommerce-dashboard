<script setup lang="ts">
const { view, cart, user, error, message, busy, go, dashboard, logout } = useMarket();
</script>

<template>
  <div :class="{ 'recovered-home': view === 'home', 'marketplace-shell': view !== 'home' }">
    <NuxtPage v-if="view === 'home'" />
    <div v-if="view !== 'home'" class="notice">
      نسخة تطوير • كل المنتجات والأسعار والطلبات للتجربة فقط • الدفع والتوصيل
      غير مفعّلين
    </div>
    <header v-if="view !== 'home'">
      <a href="/" class="brand"><img src="/assets/reference-logo.png" alt="غيار" /></a>
      <div class="top"><strong>{{ ({shops:"المحلات ونتائج البحث",product:"تفاصيل المنتج",cart:"سلة المشتريات",checkout:"إتمام الطلب",orders:"طلباتي",profile:"حسابي",login:"أهلًا بيك",dashboard:"لوحة التحكم"} as Record<string,string>)[view] }}</strong></div>
      <button v-if="user" @click="go('profile')">أهلًا {{ user.name }}</button
      ><button v-else @click="go('login')">دخول / حساب جديد</button
      ><button @click="go('cart')">
        السلة ({{ cart.reduce((s, i) => s + i.quantity, 0) }})
      </button>
    </header>
    <nav v-if="view !== 'home'">
      <button :class="{ on: view === 'home' }" @click="go('home')">
        الرئيسية</button
      ><button @click="go('shops')">المحلات</button
      ><button @click="go('orders')">طلباتي</button
      ><button @click="go('profile')">عربياتي وعناويني</button
      ><button v-if="user && user.role !== 'CUSTOMER'" @click="dashboard">
        {{ user.role === "ADMIN" ? "إدارة المنصة" : "لوحة التاجر" }}</button
      ><button v-if="user" @click="logout">خروج</button>
    </nav>
    <main v-if="view !== 'home'">
      <div v-if="error" class="error" role="alert">{{ error }}</div>
      <div v-if="message" class="success" role="status">{{ message }}</div>
      <p v-if="busy" class="muted" aria-live="polite">جارٍ التحميل...</p>
      <NuxtPage v-if="view !== 'home'" />
    </main>
    <footer>
      غيار • نسخة تطوير 0.1 • اسم وهوية مبدئية • لا يتم تحصيل أي مبالغ
    </footer>
  </div>
</template>
