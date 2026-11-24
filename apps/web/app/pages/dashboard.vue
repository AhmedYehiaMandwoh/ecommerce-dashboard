<script setup lang="ts">
const { api, applicationReasons, approve, busy, catalogEditor, createOffer, createProduct, createShop, csv, dash, dashboard, dashboardTab, decideCancellation, decideReturn, decideShopApplication, decisionForm, deleteFitment, deliveryArea, doImport, editCatalog, expandedOrder, fitmentForm, go, imageUrl, importFile, importHistory, importResult, importShop, loadAccountTools, loadImportHistory, money, newShop, next, offerForm, orders, productForm, products, recordRefund, refundForm, replyTicket, returnDecision, run, saveCatalog, saveDeliveryArea, saveFitment, saveOffer, settleShipping, settlementForm, shippingBalance, shops, status, statusLabels, ticketReply, tickets, uploadCatalogImage, user, view } = useMarket();
</script>

<template>
  <div>
        <template v-if="dash"
        ><div class="row between">
          <h1>
            {{ user.role === "ADMIN" ? "لوحة إدارة المنصة" : "لوحة التاجر" }}
          </h1>
          <button @click="dashboard">تحديث البيانات</button>
        </div>
        <div class="dashboard-identity"><img src="/assets/shop-icon.png" alt=""/><div><h2>{{ user.role === 'ADMIN' ? 'إدارة المنصة' : (dash.shops[0]?.name || 'متجرك') }}</h2><p>بيانات التجربة الحالية من قاعدة البيانات</p></div></div>
        <div class="dashboard-tabs"><button v-for="t in [['overview','نظرة عامة'],['orders','الطلبات'],['inventory','المنتجات والمخزون'],['import','استيراد وإضافة'],['settlements','تسويات الشحن'],['returns','الإرجاع ورد النقدية'],...(user.role==='ADMIN'?[['review','مركز المراجعة'],['delivery','مناطق التوصيل'],['applications','انضمام المحلات'],['support','دعم العملاء']]:[])]" :key="t[0]" :class="{active:dashboardTab===t[0]}" @click="go('dashboard' + (t[0] === 'overview' ? '' : '/' + t[0]))">{{ t[1] }}</button></div>
        <NuxtPage />
      </template>
  </div>
</template>
