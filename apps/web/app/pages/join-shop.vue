<script setup lang="ts">
const { t } = useI18n();
const { user, go, shopApplication } = useMarket();
</script>

<template>
  <div class="join-page">
    <div v-if="!user" class="empty"><button @click="go('login')">{{ t('سجّل الدخول') }}</button></div>
    <ShopApplyForm v-else-if="user.role === 'CUSTOMER'" />
    <div v-else class="card"><p>{{ t('حسابك مفعّل كتاجر. عدّل بيانات وصور محلك من لوحة التاجر.') }}</p><button class="orange" @click="go('dashboard')">{{ t('لوحة التاجر') }}</button></div>
  </div>
</template>

<style>
.join-page{max-width:1500px;margin:0 auto;padding:12px 16px 40px}
</style>
