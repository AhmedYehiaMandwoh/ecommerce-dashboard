<script setup lang="ts">
const { busy, createOffer, createProduct, createShop, csv, dash, doImport, importFile, importHistory, importResult, importShop, loadImportHistory, newShop, offerForm, productForm } = useMarket();
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <Card class="space-y-3 p-5">
      <h2 class="text-lg font-extrabold">استيراد عروض CSV</h2>
      <p class="text-sm text-muted-foreground">حتى ١٠٠٠ صف للدفعة. الكمية لقطة مطلقة وليست زيادة. المعاينة لا تحفظ. الأعمدة: sku,brand,part_number,price_minor,stock. السعر بالقرش.</p>
      <Label>المتجر</Label>
      <Select v-model="importShop"><SelectTrigger class="w-full"><SelectValue placeholder="اختر المتجر" /></SelectTrigger><SelectContent><SelectItem v-for="s in dash.shops" :key="s.id" :value="s.id">{{ s.name }}</SelectItem></SelectContent></Select>
      <Input type="file" accept=".csv,text/csv" @change="importFile" />
      <Textarea v-model="csv" rows="5" dir="ltr" placeholder="sku,brand,part_number,price_minor,stock" @input="importResult = null" />
      <div class="grid grid-cols-2 gap-3">
        <Button variant="outline" :disabled="busy || !csv || !importShop" @click="doImport(false)">معاينة</Button>
        <Button :disabled="busy || !importResult || importResult.invalid > 0" @click="doImport(true)">تأكيد الاستيراد</Button>
      </div>
      <Button variant="outline" size="sm" :disabled="!importShop || busy" @click="loadImportHistory">سجل الاستيراد</Button>
      <div v-for="job in importHistory" :key="job.id" class="border-t pt-2 text-sm"><small dir="ltr">{{job.fileHash.slice(0,16)}} • {{job.state}} • {{job.total}} rows</small></div>
      <pre v-if="importResult" dir="ltr" class="max-h-64 overflow-auto rounded-lg bg-secondary p-3 text-xs">{{ JSON.stringify(importResult, null, 2) }}</pre>
    </Card>
    <Card class="space-y-2 p-5">
      <h2 class="text-lg font-extrabold">إضافة عرض لصنف موجود</h2>
      <form class="space-y-2" @submit.prevent="createOffer">
        <Label>المتجر</Label>
        <Select v-model="importShop"><SelectTrigger class="w-full"><SelectValue placeholder="اختر المتجر" /></SelectTrigger><SelectContent><SelectItem v-for="s in dash.shops" :key="s.id" :value="s.id">{{ s.name }}</SelectItem></SelectContent></Select>
        <Label>معرف المنتج</Label><Input v-model="offerForm.productId" required />
        <Label>كود التاجر SKU</Label><Input v-model="offerForm.sku" required />
        <Label>السعر بالقرش</Label><Input v-model.number="offerForm.price" type="number" min="1" required />
        <Label>الكمية</Label><Input v-model.number="offerForm.stock" type="number" min="0" required />
        <Button type="submit" class="w-full" :disabled="busy">إضافة العرض</Button>
      </form>
    </Card>
    <Card class="space-y-2 p-5">
      <h2 class="text-lg font-extrabold">طلب إضافة منتج للكتالوج</h2>
      <form class="space-y-2" @submit.prevent="createProduct">
        <Label>الماركة</Label><Input v-model="productForm.brand" required />
        <Label>رقم القطعة</Label><Input v-model="productForm.partNumber" required />
        <Label>اسم المنتج</Label><Input v-model="productForm.title" required />
        <Label>القسم</Label><Input v-model="productForm.category" required />
        <Label>الوصف</Label><Textarea v-model="productForm.description" required />
        <Button type="submit" class="w-full" :disabled="busy">إرسال للمراجعة</Button>
      </form>
    </Card>
    <Card class="space-y-2 p-5">
      <h2 class="text-lg font-extrabold">إضافة متجر</h2>
      <form class="space-y-2" @submit.prevent="createShop">
        <Label>اسم المتجر</Label><Input v-model="newShop.name" required />
        <Label>المدينة</Label><Input v-model="newShop.city" required />
        <Button type="submit" class="w-full" :disabled="busy">إضافة للمراجعة</Button>
      </form>
    </Card>
  </div>
</template>
