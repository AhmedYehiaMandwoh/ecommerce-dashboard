<script setup lang="ts">
const { t } = useI18n();
import { Store, Clock, MapPin } from "lucide-vue-next";
const { api, busy, run, message, user } = useMarket();
const shop = ref<any>(null);
const form = reactive({ description: "", workingHours: "", district: "" });
async function load() { shop.value = await api("/merchant/shop"); form.description = shop.value.description || ""; form.workingHours = shop.value.workingHours || ""; form.district = shop.value.district || ""; }
async function save() { await run(async () => { await api("/merchant/shop", "PATCH", { description: form.description.trim(), workingHours: form.workingHours.trim(), district: form.district.trim() }); await load(); message.value = t('تم حفظ ملف المحل'); }); }
onMounted(() => run(load));
</script>

<template>
  <div v-if="user.role === 'MERCHANT' && shop" class="grid grid-cols-1 items-start gap-4 xl:grid-cols-2 [&>*]:min-w-0">
    <Card class="gap-3 p-4">
      <h2 class="flex items-center gap-2 text-lg font-extrabold"><Store class="size-5 text-primary" /> {{ t('بيانات صفحة المحل') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('دي البيانات اللي بتظهر للعملاء في صفحة المحل. اسم المحل والمدينة بتتغير من الإدارة.') }}</p>
      <p class="text-sm">{{ t('الاسم:') }} <b>{{ shop.name }}</b> {{ t('• المدينة:') }} <b>{{ shop.city }}</b></p>
      <form class="grid grid-cols-1 gap-3 sm:grid-cols-2" @submit.prevent="save">
        <div class="space-y-1"><Label for="sp-d" class="flex items-center gap-1"><MapPin class="size-4" /> {{ t('الحي أو المنطقة (اختياري)') }}</Label><Input id="sp-d" v-model="form.district" maxlength="80" /></div>
        <div class="space-y-1"><Label for="sp-h" class="flex items-center gap-1"><Clock class="size-4" /> {{ t('مواعيد العمل (اختياري)') }}</Label><Input id="sp-h" v-model="form.workingHours" maxlength="120" /></div>
        <div class="space-y-1 sm:col-span-2"><Label for="sp-n">{{ t('نبذة عن المحل (اختياري)') }}</Label><Textarea id="sp-n" v-model="form.description" rows="3" maxlength="180" /><p class="text-xs text-muted-foreground">{{ t('حتى 180 حرف.') }}</p></div>
        <Button class="sm:col-span-2 sm:w-fit" :disabled="busy">{{ t('حفظ') }}</Button>
      </form>
    </Card>
    <Card class="gap-3 p-4">
      <h2 class="text-lg font-extrabold">{{ t('صور المحل') }}</h2>
      <ShopPhotoManager scope="shop" :photos="shop.photos || []" @changed="load" />
    </Card>
  </div>
</template>
