<script setup lang="ts">
const { t } = useI18n();
import { ChevronLeft, Truck, Undo2, Headset, Boxes, Upload, Wallet, Banknote } from "lucide-vue-next";
const { user } = useMarket();
const admin = computed(() => user.value?.role === "ADMIN");
const items = computed(() => [
  { to: "/dashboard/add-product", label: t('إضافة منتج'), icon: Boxes, show: !admin.value },
  { to: "/dashboard/review", label: t('مركز المراجعة'), icon: Boxes, show: admin.value },
  { to: "/dashboard/orders", label: t('الطلبات'), icon: Boxes, show: admin.value },
  { to: "/dashboard/catalog", label: t('الكتالوج والحسابات (تفصيلي)'), icon: Boxes, show: admin.value },
  { to: "/dashboard/legacy-orders", label: t('التحصيل وطلبات الإلغاء'), icon: Banknote, show: true },
  { to: "/dashboard/inventory", label: t('المنتجات والمخزون'), icon: Boxes, show: true },
  { to: "/dashboard/import", label: t('استيراد وإضافة (CSV)'), icon: Upload, show: true },
  { to: "/dashboard/settlements", label: t('تسويات الشحن'), icon: Wallet, show: true },
  { to: "/dashboard/returns", label: t('المرتجعات'), icon: Undo2, show: true },
  { to: "/dashboard/delivery", label: t('مناطق ورسوم التوصيل'), icon: Truck, show: admin.value },
  { to: "/dashboard/support", label: t('الدعم'), icon: Headset, show: true },
].filter((i) => i.show));
</script>

<template>
  <div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
    <NuxtLink v-for="i in items" :key="i.to" :to="i.to"><Card class="mb-2 flex-row items-center gap-3 p-4"><component :is="i.icon" class="size-6 text-primary" /><span class="flex-1 font-bold">{{ i.label }}</span><ChevronLeft class="size-4" /></Card></NuxtLink>
  </div>
</template>
