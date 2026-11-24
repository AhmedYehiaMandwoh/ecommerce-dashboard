<script setup lang="ts">
const { dash, dashboard, dashboardTab, money } = useMarket();
</script>

<template>
  <div>
        <div v-if="dashboardTab === 'overview'" class="metrics dashboard-metrics">
          <div class="card">
            الطلبات (آخر ١٠٠)<b>{{ dash.summary.orders }}</b>
          </div>
          <div class="card">
            العروض<b>{{ dash.summary.offers }}</b>
          </div>
          <div class="card">
            إجمالي المسلّم<b>{{ money(dash.summary.revenue) }}</b>
          </div>
        </div>
    <DashboardOrders />
  </div>
</template>
