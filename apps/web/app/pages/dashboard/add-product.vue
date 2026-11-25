<script setup lang="ts">
const { t } = useI18n();
import { Info, Car, Camera, Plus, X } from "lucide-vue-next";
const { api, base, busy, categories, createOffer, dash, importShop, message, offerForm, productForm, run, token } = useMarket();
const approved = computed(() => (dash.value.products || []).filter((p: any) => p.approved));
const mine = computed(() => (dash.value.products || []).filter((p: any) => !p.approved));
const catalog = ref<any>({ makes: [] });
const rows = ref<{ make: string; model: string; fromYear: string; toYear: string; engine: string }[]>([]);
const draft = reactive({ make: "", model: "", fromYear: "", toYear: "", engine: "" });
const proposed = reactive({ price: "", stock: "" });
const file = ref<File | null>(null);
const preview = ref("");
const mk = computed(() => catalog.value.makes.find((m: any) => m.make === draft.make));
const md = computed(() => mk.value?.models.find((m: any) => m.model === draft.model));
const years = computed(() => (md.value ? Array.from({ length: md.value.to - md.value.from + 1 }, (_, i) => String(md.value.to - i)) : []));
onMounted(async () => {
  if (!importShop.value && dash.value.shops?.[0]) importShop.value = dash.value.shops[0].id;
  try { catalog.value = await (await fetch(base + "/vehicle-catalog")).json(); } catch {}
});
function pick(e: any) { const f = e.target.files?.[0]; if (!f) return; file.value = f; preview.value = URL.createObjectURL(f); }
function addRow() { if (!draft.make || !draft.model || !draft.fromYear || !draft.toYear || !draft.engine) return; rows.value.push({ ...draft }); Object.assign(draft, { make: "", model: "", fromYear: "", toYear: "", engine: "" }); }
async function submit() {
  await run(async () => {
    const p = await api("/products", "POST", { ...productForm, ...(proposed.price !== "" && proposed.stock !== "" ? { proposedPrice: Number(proposed.price), proposedStock: Number(proposed.stock) } : {}) });
    for (const r of rows.value) await api(`/products/${p.id}/fitments`, "POST", { make: r.make, model: r.model, fromYear: Number(r.fromYear), toYear: Number(r.toYear), engine: r.engine });
    if (file.value) {
      const form = new FormData(); form.append("image", file.value);
      const res = await fetch(`${base}/products/${p.id}/image`, { method: "POST", headers: { Authorization: "Bearer " + token.value }, body: form });
      if (!res.ok) throw Error((await res.json()).message || t('تعذر رفع الصورة'));
    }
    proposed.price = ""; proposed.stock = "";
    dash.value = await api("/dashboard");
    rows.value = []; file.value = null; preview.value = "";
    Object.assign(productForm, { brand: "", partNumber: "", title: "", category: "", description: "" });
    message.value = t('تم إرسال المنتج لمراجعة الإدارة. السعر والمخزون المقترحان محفوظان ويظهران جاهزين في نموذج العرض بعد الاعتماد');
  });
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
    <Card class="p-2">
      <h2 class="mb-2 hidden text-lg font-extrabold lg:block">{{ t('بيانات المنتج') }}</h2>
      <form class="space-y-1.5" @submit.prevent="submit">
        <div class="space-y-2">
          <label class="flex h-20 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm text-muted-foreground">
            <img v-if="preview" :src="preview" :alt="t('معاينة الصورة')" class="h-full w-full rounded-xl object-contain" />
            <template v-else><Camera class="size-6" /> {{ t('إضافة صورة المنتج (صورة واحدة)') }}</template>
            <input type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" :aria-label="t('صورة المنتج')" @change="pick" />
          </label>
          <div class="space-y-1"><Label for="p-title">{{ t('اسم المنتج') }}</Label><Input id="p-title" v-model="productForm.title" required :placeholder="t('فحمات فرامل أمامية')" /></div>
          <div class="grid grid-cols-2 gap-2"><div class="space-y-1"><Label for="p-part">{{ t('رقم القطعة') }}</Label><Input id="p-part" v-model="productForm.partNumber" required dir="ltr" placeholder="BP-001" /></div>
            <div class="space-y-1"><Label for="p-brand">{{ t('الماركة (العلامة التجارية)') }}</Label><Input id="p-brand" v-model="productForm.brand" required placeholder="BOSCH" /></div></div>
        </div>
        <div class="grid grid-cols-1 gap-2">
          <div class="space-y-1"><Label>{{ t('القسم') }}</Label>
            <Select v-model="productForm.category"><SelectTrigger class="w-full" :aria-label="t('القسم')"><SelectValue :placeholder="t('اختر القسم')">{{ productForm.category || undefined }}</SelectValue></SelectTrigger>
              <SelectContent><SelectItem v-for="c in (categories || [])" :key="c" :value="c">{{ c }}</SelectItem></SelectContent></Select></div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1"><Label for="p-price">{{ t('السعر (بالقروش)') }}</Label><Input id="p-price" v-model="proposed.price" type="number" min="1" step="1" :required="proposed.stock !== ''" :placeholder="t('أدخل السعر')" /></div>
          <div class="space-y-1"><Label for="p-stock">{{ t('المخزون') }}</Label><Input id="p-stock" v-model="proposed.stock" type="number" min="0" step="1" :required="proposed.price !== ''" :placeholder="t('أدخل الكمية')" /></div>
        </div>
        <div class="space-y-1"><Label for="p-desc">{{ t('الوصف') }}</Label><Textarea id="p-desc" v-model="productForm.description" required rows="1" class="min-h-10" /></div>
        <div class="space-y-2 rounded-xl bg-secondary p-3">
          <b class="flex items-center gap-2"><Car class="size-5 text-primary" /> {{ t('بيانات التوافق') }}</b>
          <div class="grid grid-cols-3 gap-1.5">
            <Select v-model="draft.make" @update:model-value="() => { draft.model = ''; draft.fromYear = ''; draft.toYear = ''; draft.engine = ''; }"><SelectTrigger class="w-full bg-white" :aria-label="t('الماركة')"><SelectValue :placeholder="t('اختر الماركة')" /></SelectTrigger><SelectContent><SelectItem v-for="m in catalog.makes" :key="m.make" :value="m.make">{{ m.make }}</SelectItem></SelectContent></Select>
            <Select v-model="draft.model" :disabled="!mk"><SelectTrigger class="w-full bg-white" :aria-label="t('الموديل')"><SelectValue :placeholder="t('اختر الموديل')" /></SelectTrigger><SelectContent><SelectItem v-for="m in (mk?.models || [])" :key="m.model" :value="m.model">{{ m.model }}</SelectItem></SelectContent></Select>
            <Select v-model="draft.fromYear" :disabled="!md"><SelectTrigger class="w-full bg-white" :aria-label="t('من سنة')"><SelectValue :placeholder="t('من سنة')" /></SelectTrigger><SelectContent><SelectItem v-for="y in years" :key="y" :value="y">{{ y }}</SelectItem></SelectContent></Select>
            <Select v-model="draft.toYear" :disabled="!md"><SelectTrigger class="w-full bg-white" :aria-label="t('إلى سنة')"><SelectValue :placeholder="t('إلى سنة')" /></SelectTrigger><SelectContent><SelectItem v-for="y in years" :key="y" :value="y">{{ y }}</SelectItem></SelectContent></Select>
            <Select v-model="draft.engine" :disabled="!md"><SelectTrigger class="col-span-2 w-full bg-white" :aria-label="t('المحرك')"><SelectValue :placeholder="t('اختر المحرك')" /></SelectTrigger><SelectContent><SelectItem v-for="e in (md?.engines || [])" :key="e" :value="e">{{ e }}</SelectItem></SelectContent></Select>
          </div>
          <Button type="button" variant="outline" size="sm" :disabled="!draft.engine || !draft.toYear || !draft.fromYear || Number(draft.fromYear) > Number(draft.toYear)" @click="addRow"><Plus class="size-4" /> {{ t('إضافة هذا التوافق') }}</Button>
          <ul class="space-y-1 text-sm"><li v-for="(r, i) in rows" :key="i" class="flex items-center justify-between rounded-lg bg-white px-3 py-2"><span>{{ r.make }} {{ r.model }} • {{ r.fromYear }}-{{ r.toYear }} • {{ r.engine }}</span><button type="button" :aria-label="t('حذف توافق {0}', i + 1)" @click="rows.splice(i, 1)"><X class="size-4" /></button></li></ul>
          <div class="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-muted-foreground"><Info class="mt-0.5 size-5 shrink-0 text-primary" /><div><b class="block text-sm text-primary">{{ t('تحقق من بيانات التوافق') }}</b>{{ t('التوافق يُحفظ كغير مؤكد، وتراجعه الإدارة قبل ظهوره كمؤكد للعملاء.') }}</div></div>
        </div>
        <div class="sticky bottom-[84px] z-10 bg-background/95 px-1 pb-1 pt-2 md:static md:bg-transparent"><Button type="submit" class="w-full bg-accent text-accent-foreground" size="lg" :disabled="busy || !productForm.category">{{ t('حفظ المنتج وإرساله للمراجعة') }}</Button></div>
      </form>
    </Card>
    <div class="space-y-4">
      <Card class="p-5">
        <h2 class="mb-3 text-lg font-extrabold">{{ t('السعر والمخزون') }}</h2>
        <p class="mb-3 text-sm text-muted-foreground">{{ t('بعد اعتماد المنتج من الإدارة، اختره هنا وحدد السعر والمخزون لمتجرك.') }}</p>
        <form class="space-y-3" @submit.prevent="createOffer">
          <div class="space-y-1"><Label>{{ t('المنتج المعتمد') }}</Label>
            <Select v-model="offerForm.productId" @update:model-value="(id: any) => { const o = (dash.proposals || []).find((x: any) => x.productId === id); if (o) { offerForm.price = o.price; offerForm.stock = o.stock; } }"><SelectTrigger class="w-full" :aria-label="t('المنتج المعتمد')"><SelectValue :placeholder="t('اختر منتجًا معتمدًا')" /></SelectTrigger>
              <SelectContent><SelectItem v-for="p in approved" :key="p.id" :value="p.id">{{ p.brand }} • {{ p.title }}</SelectItem></SelectContent></Select></div>
          <div class="space-y-1"><Label for="o-sku">{{ t('كود الصنف SKU') }}</Label><Input id="o-sku" v-model="offerForm.sku" required dir="ltr" /></div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1"><Label for="o-price">{{ t('السعر (بالقروش)') }}</Label><Input id="o-price" v-model="offerForm.price" type="number" min="1" required /></div>
            <div class="space-y-1"><Label for="o-stock">{{ t('المخزون') }}</Label><Input id="o-stock" v-model="offerForm.stock" type="number" min="0" required /></div>
          </div>
          <Button type="submit" class="w-full" size="lg" :disabled="busy || !offerForm.productId">{{ t('حفظ العرض') }}</Button>
        </form>
      </Card>
      <Card v-if="mine.length" class="p-5"><h2 class="mb-2 font-extrabold">{{ t('منتجاتي بانتظار المراجعة') }}</h2>
        <div v-for="p in mine" :key="p.id" class="flex items-center justify-between border-t py-2 text-sm"><span>{{ p.brand }} • {{ p.title }} <small class="text-muted-foreground">{{ t('({0} توافق)', p.fitments?.length || 0) }}</small></span><Badge variant="outline" class="border-accent text-accent">{{ t('بانتظار المراجعة') }}</Badge></div></Card>
    </div>
  </div>
</template>
