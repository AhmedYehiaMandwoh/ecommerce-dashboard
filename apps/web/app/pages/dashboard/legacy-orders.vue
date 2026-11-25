<script setup lang="ts">
const { t } = useI18n();
</script>
<template>
  <div class="space-y-3">
    <h2 class="text-lg font-extrabold">{{ t('التحصيل وطلبات الإلغاء') }}</h2>
    <p class="text-sm text-muted-foreground">{{ t('متابعة تفصيلية لكل طلب، وقرارات طلبات الإلغاء بعد بدء الشحن (الإدارة).') }}</p>
    <DashboardOrders />
  </div>
</template>
