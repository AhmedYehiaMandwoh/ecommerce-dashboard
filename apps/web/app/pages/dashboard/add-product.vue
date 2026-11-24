<script setup lang="ts">
import { Info, Car } from "lucide-vue-next";
const { busy, categories, createOffer, createProduct, dash, importShop, offerForm, productForm } = useMarket();
const approved = computed(() => (dash.value.products || []).filter((p: any) => p.approved));
onMounted(() => { if (!importShop.value && dash.value.shops?.[0]) importShop.value = dash.value.shops[0].id; });
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <Card class="p-5">
      <h2 class="mb-3 text-lg font-extrabold">بيانات المنتج</h2>
      <form class="space-y-3" @submit.prevent="createProduct">
        <div class="space-y-1"><Label for="p-title">اسم المنتج</Label><Input id="p-title" v-model="productForm.title" required placeholder="فحمات فرامل أمامية" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1"><Label for="p-brand">الماركة</Label><Input id="p-brand" v-model="productForm.brand" required placeholder="BOSCH" /></div>
          <div class="space-y-1"><Label for="p-part">رقم القطعة</Label><Input id="p-part" v-model="productForm.partNumber" required dir="ltr" placeholder="BP-001" /></div>
        </div>
        <div class="space-y-1"><Label>القسم</Label>
          <Select v-model="productForm.category"><SelectTrigger class="w-full"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
            <SelectContent><SelectItem v-for="c in (categories || [])" :key="c" :value="c">{{ c }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-1"><Label for="p-desc">الوصف</Label><Textarea id="p-desc" v-model="productForm.description" required /></div>
        <div class="flex items-start gap-3 rounded-xl bg-secondary p-3 text-sm"><Info class="mt-0.5 size-5 shrink-0 text-primary" /><div><b class="flex items-center gap-1"><Car class="size-4" /> بيانات التوافق</b>تراجع الإدارة بيانات التوافق (الماركة والموديل وسنة الصنع) قبل اعتماد المنتج، ولا يظهر أي توافق للعملاء قبل ذلك.</div></div>
        <Button type="submit" class="w-full bg-accent text-accent-foreground" size="lg" :disabled="busy || !productForm.category">حفظ المنتج وإرساله للمراجعة</Button>
      </form>
    </Card>
    <Card class="p-5">
      <h2 class="mb-3 text-lg font-extrabold">السعر والمخزون</h2>
      <p class="mb-3 text-sm text-muted-foreground">بعد اعتماد المنتج من الإدارة، اختره هنا وحدد السعر والمخزون لمتجرك.</p>
      <form class="space-y-3" @submit.prevent="createOffer">
        <div class="space-y-1"><Label>المنتج المعتمد</Label>
          <Select v-model="offerForm.productId"><SelectTrigger class="w-full"><SelectValue placeholder="اختر منتجًا معتمدًا" /></SelectTrigger>
            <SelectContent><SelectItem v-for="p in approved" :key="p.id" :value="p.id">{{ p.brand }} • {{ p.title }}</SelectItem></SelectContent></Select></div>
        <div class="space-y-1"><Label for="o-sku">كود الصنف SKU</Label><Input id="o-sku" v-model="offerForm.sku" required dir="ltr" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1"><Label for="o-price">السعر (بالقروش)</Label><Input id="o-price" v-model="offerForm.price" type="number" min="1" required /></div>
          <div class="space-y-1"><Label for="o-stock">المخزون</Label><Input id="o-stock" v-model="offerForm.stock" type="number" min="0" required /></div>
        </div>
        <Button type="submit" class="w-full" size="lg" :disabled="busy || !offerForm.productId">حفظ العرض</Button>
      </form>
    </Card>
  </div>
</template>
