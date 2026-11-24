<script setup lang="ts">
import { ChevronLeft, Truck, Undo2, Headset, Boxes, Upload, Wallet, Banknote } from "lucide-vue-next";
const { user } = useMarket();
const admin = computed(() => user.value?.role === "ADMIN");
const items = computed(() => [
  { to: "/dashboard/catalog", label: "الكتالوج والحسابات (تفصيلي)", icon: Boxes, show: admin.value },
  { to: "/dashboard/legacy-orders", label: "التحصيل وطلبات الإلغاء", icon: Banknote, show: true },
  { to: "/dashboard/inventory", label: "المنتجات والمخزون", icon: Boxes, show: true },
  { to: "/dashboard/import", label: "استيراد وإضافة (CSV)", icon: Upload, show: true },
  { to: "/dashboard/settlements", label: "تسويات الشحن", icon: Wallet, show: true },
  { to: "/dashboard/returns", label: "المرتجعات", icon: Undo2, show: true },
  { to: "/dashboard/delivery", label: "مناطق ورسوم التوصيل", icon: Truck, show: admin.value },
  { to: "/dashboard/support", label: "الدعم", icon: Headset, show: true },
].filter((i) => i.show));
</script>

<template>
  <div class="space-y-2">
    <NuxtLink v-for="i in items" :key="i.to" :to="i.to"><Card class="mb-2 flex-row items-center gap-3 p-4"><component :is="i.icon" class="size-6 text-primary" /><span class="flex-1 font-bold">{{ i.label }}</span><ChevronLeft class="size-4" /></Card></NuxtLink>
  </div>
</template>
