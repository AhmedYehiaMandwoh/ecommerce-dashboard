<script setup lang="ts">
const { t } = useI18n();
const { busy, createOffer, createProduct, createShop, csv, dash, doImport, importFile, importHistory, importResult, importShop, loadImportHistory, newShop, offerForm, productForm } = useMarket();
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3 [&>*]:min-w-0">
    <Card class="space-y-3 p-5">
      <h2 class="text-lg font-extrabold">{{ t('استيراد عروض CSV') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('حتى ١٠٠٠ صف للدفعة. الكمية لقطة مطلقة وليست زيادة. المعاينة لا تحفظ. الأعمدة: sku,brand,part_number,price_minor,stock. السعر بالقرش.') }}</p>
      <Label>{{ t('المتجر') }}</Label>
      <Select v-model="importShop"><SelectTrigger class="w-full"><SelectValue :placeholder="t('اختر المتجر')" /></SelectTrigger><SelectContent><SelectItem v-for="s in dash.shops" :key="s.id" :value="s.id">{{ s.name }}</SelectItem></SelectContent></Select>
      <Input type="file" accept=".csv,text/csv" @change="importFile" />
      <Textarea v-model="csv" rows="5" dir="ltr" placeholder="sku,brand,part_number,price_minor,stock" @input="importResult = null" />
      <div class="grid grid-cols-2 gap-3">
        <Button variant="outline" :disabled="busy || !csv || !importShop" @click="doImport(false)">{{ t('معاينة') }}</Button>
        <Button :disabled="busy || !importResult || importResult.invalid > 0" @click="doImport(true)">{{ t('تأكيد الاستيراد') }}</Button>
      </div>
      <Button variant="outline" size="sm" :disabled="!importShop || busy" @click="loadImportHistory">{{ t('سجل الاستيراد') }}</Button>
      <div v-for="job in importHistory" :key="job.id" class="border-t pt-2 text-sm"><small dir="ltr">{{job.fileHash.slice(0,16)}} • {{job.state}} • {{job.total}} rows</small></div>
      <pre v-if="importResult" dir="ltr" class="max-h-64 overflow-auto rounded-lg bg-secondary p-3 text-xs">{{ JSON.stringify(importResult, null, 2) }}</pre>
    </Card>
    <Card class="space-y-2 p-5">
      <h2 class="text-lg font-extrabold">{{ t('إضافة عرض لصنف موجود') }}</h2>
      <form class="space-y-2" @submit.prevent="createOffer">
        <Label>{{ t('المتجر') }}</Label>
        <Select v-model="importShop"><SelectTrigger class="w-full"><SelectValue :placeholder="t('اختر المتجر')" /></SelectTrigger><SelectContent><SelectItem v-for="s in dash.shops" :key="s.id" :value="s.id">{{ s.name }}</SelectItem></SelectContent></Select>
        <Label>{{ t('معرف المنتج') }}</Label><Input v-model="offerForm.productId" required />
        <Label>{{ t('كود التاجر SKU') }}</Label><Input v-model="offerForm.sku" required />
        <Label>{{ t('السعر بالقرش') }}</Label><Input v-model.number="offerForm.price" type="number" min="1" required />
        <Label>{{ t('الكمية') }}</Label><Input v-model.number="offerForm.stock" type="number" min="0" required />
        <Button type="submit" class="w-full" :disabled="busy">{{ t('إضافة العرض') }}</Button>
      </form>
    </Card>
    <Card class="space-y-2 p-5">
      <h2 class="text-lg font-extrabold">{{ t('طلب إضافة منتج للكتالوج') }}</h2>
      <form class="space-y-2" @submit.prevent="createProduct">
        <Label>{{ t('الماركة') }}</Label><Input v-model="productForm.brand" required />
        <Label>{{ t('رقم القطعة') }}</Label><Input v-model="productForm.partNumber" required />
        <Label>{{ t('اسم المنتج') }}</Label><Input v-model="productForm.title" required />
        <Label>{{ t('القسم') }}</Label><Input v-model="productForm.category" required />
        <Label>{{ t('الوصف') }}</Label><Textarea v-model="productForm.description" required />
        <Button type="submit" class="w-full" :disabled="busy">{{ t('إرسال للمراجعة') }}</Button>
      </form>
    </Card>
    <Card class="space-y-2 p-5">
      <h2 class="text-lg font-extrabold">{{ t('إضافة متجر') }}</h2>
      <form class="space-y-2" @submit.prevent="createShop">
        <Label>{{ t('اسم المتجر') }}</Label><Input v-model="newShop.name" required />
        <Label>{{ t('المدينة') }}</Label><Input v-model="newShop.city" required />
        <Button type="submit" class="w-full" :disabled="busy">{{ t('إضافة للمراجعة') }}</Button>
      </form>
    </Card>
  </div>
</template>
