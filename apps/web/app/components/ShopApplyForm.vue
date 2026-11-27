<script setup lang="ts">
const { t } = useI18n();
const { api, base, token, busy, joinForm, shopApplication, personal, run, message } = useMarket();
const app = computed(() => shopApplication.value);
const editable = computed(() => !app.value || app.value.state === "PENDING" || app.value.state === "REJECTED");
const states: Record<string, string> = { PENDING: t('قيد المراجعة'), APPROVED: t('تمت الموافقة'), REJECTED: t('مرفوض'), SUSPENDED: t('موقوف') };
const kinds: [string, string, string][] = [["REGISTRATION", t('السجل التجاري'), t('اختياري. صورة أو PDF')], ["TAX", t('البطاقة الضريبية'), t('اختياري. صورة أو PDF')], ["ID", t('بطاقة هوية صاحب المحل'), t('اختياري. صورة أو PDF')]];
const docErr = ref("");
function fill() { const a = app.value; if (!a) return; for (const k of Object.keys(joinForm) as (keyof typeof joinForm)[]) (joinForm as any)[k] = a[k] ?? ""; }
watch(app, fill, { immediate: true });
async function save() {
  await run(async () => {
    const body: any = {}; for (const [k, v] of Object.entries(joinForm)) if (String(v).trim() !== "") body[k] = String(v).trim();
    if (app.value && app.value.state === "PENDING") await api("/shop-application", "PATCH", body);
    else await api("/shop-applications", "POST", body);
    await personal();
    message.value = t('تم حفظ بيانات الطلب. تقدر ترفع الصور والمستندات تحت.');
  });
}
async function upDoc(e: any, kind: string) {
  const file = e.target.files?.[0]; e.target.value = ""; docErr.value = "";
  if (!file) return;
  if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) { docErr.value = t('الصيغ المسموحة PDF أو JPEG أو PNG أو WebP'); return; }
  if (file.size > 5 * 1024 * 1024) { docErr.value = t('حجم الملف أقل من 5 ميجا'); return; }
  const form = new FormData(); form.append("kind", kind); form.append("file", file);
  const res = await fetch(base + "/shop-application/documents", { method: "POST", headers: { Authorization: "Bearer " + token.value }, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { docErr.value = data.message || t('تعذر رفع المستند'); return; }
  await personal();
}
async function delDoc(d: any) { await run(async () => { await api("/shop-application/documents/" + d.id, "DELETE"); await personal(); }); }
const docOf = (k: string) => (app.value?.documents || []).find((d: any) => d.kind === k);
</script>

<template>
  <section class="saf card section-gap">
    <h2>{{ t('انضم كتاجر') }}</h2>
    <p class="muted">{{ t('الإدارة بتراجع الطلب قبل تفعيل البيع. المراجعة يدوية وليست توثيقًا آليًا. الحقول اللي عليها * إجبارية، والباقي اختياري.') }}</p>
    <div v-if="app" class="alert">{{ t('حالة طلبك:') }} <b>{{ states[app.state] || app.state }}</b><span v-if="app.reviewReason"> • {{ app.reviewReason }}</span></div>
    <div class="saf-cols">
    <form v-if="editable" class="saf-form" @submit.prevent="save">
      <fieldset class="saf-group">
        <legend>{{ t('1. بيانات المحل') }} <small>{{ t('تظهر للعملاء بعد الموافقة') }}</small></legend>
        <div class="saf-grid">
          <label>{{ t('اسم المحل *') }}<input v-model="joinForm.name" required minlength="2" maxlength="100" /></label>
          <label>{{ t('المدينة *') }}<input v-model="joinForm.city" required minlength="2" maxlength="80" /></label>
          <label>{{ t('الحي أو المنطقة') }}<input v-model="joinForm.district" maxlength="80" /></label>
          <label>{{ t('مواعيد العمل') }}<input v-model="joinForm.workingHours" maxlength="120" :placeholder="t('مثال: يوميًا 10 ص إلى 10 م')" /></label>
          <label class="wide">{{ t('نبذة عن المحل') }}<textarea v-model="joinForm.description" rows="2" maxlength="180" /><small>{{ t('جملة أو اتنين يتعرضوا في صفحة المحل. حتى 180 حرف.') }}</small></label>
          <label class="wide">{{ t('تفاصيل النشاط للمراجعة *') }}<textarea v-model="joinForm.details" required minlength="10" maxlength="180" rows="2" /><small>{{ t('نوع القطع والماركات اللي بتبيعها. للإدارة فقط.') }}</small></label>
        </div>
      </fieldset>
      <fieldset class="saf-group">
        <legend>{{ t('2. التواصل') }} <small>{{ t('للإدارة فقط، لا يظهر للعملاء') }}</small></legend>
        <div class="saf-grid">
          <label>{{ t('اسم المسؤول') }}<input v-model="joinForm.contactName" maxlength="100" /></label>
          <label>{{ t('هاتف المحل *') }}<input v-model="joinForm.phone" required pattern="\+?[0-9]{8,15}" dir="ltr" /></label>
          <label>{{ t('واتساب') }}<input v-model="joinForm.whatsapp" pattern="\+?[0-9]{8,15}" dir="ltr" /></label>
          <label>{{ t('البريد الإلكتروني') }}<input v-model="joinForm.email" type="email" maxlength="120" dir="ltr" /></label>
        </div>
      </fieldset>
      <fieldset class="saf-group">
        <legend>{{ t('3. العنوان') }}</legend>
        <div class="saf-grid"><label class="wide">{{ t('عنوان المحل بالتفصيل *') }}<textarea v-model="joinForm.address" required minlength="8" maxlength="180" rows="2" /></label></div>
      </fieldset>
      <fieldset class="saf-group">
        <legend>{{ t('4. بيانات المستندات') }} <small>{{ t('خاصة، تتشاف للإدارة فقط') }}</small></legend>
        <div class="saf-grid">
          <label>{{ t('رقم السجل التجاري') }}<input v-model="joinForm.registrationNumber" maxlength="40" dir="ltr" /></label>
          <label>{{ t('رقم البطاقة الضريبية') }}<input v-model="joinForm.taxNumber" maxlength="40" dir="ltr" /></label>
        </div>
      </fieldset>
      <button :disabled="busy" class="saf-save">{{ app ? t('حفظ التعديلات') : t('إرسال طلب انضمام') }}</button>
    </form>

    <div class="saf-media">
    <template v-if="app && editable && app.state === 'PENDING'">
      <fieldset class="saf-group">
        <legend>{{ t('5. صور المحل') }} <small>{{ t('تظهر للعملاء') }}</small></legend>
        <ShopPhotoManager scope="application" :photos="app.photos || []" @changed="personal" />
      </fieldset>
      <fieldset class="saf-group">
        <legend>{{ t('6. مستندات خاصة') }} <small>{{ t('لا تظهر للعملاء ولا تتنشر') }}</small></legend>
        <div class="saf-docs">
          <div v-for="[k, l, h] in kinds" :key="k" class="saf-doc">
            <b>{{ l }}</b><small>{{ h }}</small>
            <span v-if="docOf(k)" class="saf-file">{{ docOf(k).originalName }} <button type="button" class="saf-x" @click="delDoc(docOf(k))">{{ t('حذف') }}</button></span>
            <label class="saf-up">{{ docOf(k) ? t('استبدال') : t('رفع الملف') }}<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" @change="upDoc($event, k)" /></label>
          </div>
        </div>
        <p v-if="docErr" class="saf-err" role="alert">{{ docErr }}</p>
      </fieldset>
    </template>
    <p v-else-if="!app && editable" class="saf-hint">{{ t('بعد إرسال الطلب تقدر ترفع صور المحل والمستندات هنا، في قسم الصور وقسم المستندات الخاصة.') }}</p>
    </div>
    </div>
  </section>
</template>

