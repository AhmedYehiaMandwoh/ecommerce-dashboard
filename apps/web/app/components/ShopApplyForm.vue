<script setup lang="ts">
const { api, base, token, busy, joinForm, shopApplication, personal, run, message } = useMarket();
const app = computed(() => shopApplication.value);
const editable = computed(() => !app.value || app.value.state === "PENDING" || app.value.state === "REJECTED");
const states: Record<string, string> = { PENDING: "قيد المراجعة", APPROVED: "تمت الموافقة", REJECTED: "مرفوض", SUSPENDED: "موقوف" };
const kinds: [string, string, string][] = [["REGISTRATION", "السجل التجاري", "اختياري. صورة أو PDF"], ["TAX", "البطاقة الضريبية", "اختياري. صورة أو PDF"], ["ID", "بطاقة هوية صاحب المحل", "اختياري. صورة أو PDF"]];
const docErr = ref("");
function fill() { const a = app.value; if (!a) return; for (const k of Object.keys(joinForm) as (keyof typeof joinForm)[]) (joinForm as any)[k] = a[k] ?? ""; }
watch(app, fill, { immediate: true });
async function save() {
  await run(async () => {
    const body: any = {}; for (const [k, v] of Object.entries(joinForm)) if (String(v).trim() !== "") body[k] = String(v).trim();
    if (app.value && app.value.state === "PENDING") await api("/shop-application", "PATCH", body);
    else await api("/shop-applications", "POST", body);
    await personal();
    message.value = "تم حفظ بيانات الطلب. تقدر ترفع الصور والمستندات تحت.";
  });
}
async function upDoc(e: any, kind: string) {
  const file = e.target.files?.[0]; e.target.value = ""; docErr.value = "";
  if (!file) return;
  if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) { docErr.value = "الصيغ المسموحة PDF أو JPEG أو PNG أو WebP"; return; }
  if (file.size > 5 * 1024 * 1024) { docErr.value = "حجم الملف أقل من 5 ميجا"; return; }
  const form = new FormData(); form.append("kind", kind); form.append("file", file);
  const res = await fetch(base + "/shop-application/documents", { method: "POST", headers: { Authorization: "Bearer " + token.value }, body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { docErr.value = data.message || "تعذر رفع المستند"; return; }
  await personal();
}
async function delDoc(d: any) { await run(async () => { await api("/shop-application/documents/" + d.id, "DELETE"); await personal(); }); }
const docOf = (k: string) => (app.value?.documents || []).find((d: any) => d.kind === k);
</script>

<template>
  <section class="saf card section-gap">
    <h2>انضم كتاجر</h2>
    <p class="muted">الإدارة بتراجع الطلب قبل تفعيل البيع. المراجعة يدوية وليست توثيقًا آليًا. الحقول اللي عليها * إجبارية، والباقي اختياري.</p>
    <div v-if="app" class="alert">حالة طلبك: <b>{{ states[app.state] || app.state }}</b><span v-if="app.reviewReason"> • {{ app.reviewReason }}</span></div>
    <form v-if="editable" class="saf-form" @submit.prevent="save">
      <fieldset class="saf-group">
        <legend>1. بيانات المحل <small>تظهر للعملاء بعد الموافقة</small></legend>
        <div class="saf-grid">
          <label>اسم المحل *<input v-model="joinForm.name" required minlength="2" maxlength="100" /></label>
          <label>المدينة *<input v-model="joinForm.city" required minlength="2" maxlength="80" /></label>
          <label>الحي أو المنطقة<input v-model="joinForm.district" maxlength="80" /></label>
          <label>مواعيد العمل<input v-model="joinForm.workingHours" maxlength="120" placeholder="مثال: يوميًا 10 ص إلى 10 م" /></label>
          <label class="wide">نبذة عن المحل<textarea v-model="joinForm.description" rows="2" maxlength="180" /><small>جملة أو اتنين يتعرضوا في صفحة المحل. حتى 180 حرف.</small></label>
          <label class="wide">تفاصيل النشاط للمراجعة *<textarea v-model="joinForm.details" required minlength="10" maxlength="180" rows="2" /><small>نوع القطع والماركات اللي بتبيعها. للإدارة فقط.</small></label>
        </div>
      </fieldset>
      <fieldset class="saf-group">
        <legend>2. التواصل <small>للإدارة فقط، لا يظهر للعملاء</small></legend>
        <div class="saf-grid">
          <label>اسم المسؤول<input v-model="joinForm.contactName" maxlength="100" /></label>
          <label>هاتف المحل *<input v-model="joinForm.phone" required pattern="\+?[0-9]{8,15}" dir="ltr" /></label>
          <label>واتساب<input v-model="joinForm.whatsapp" pattern="\+?[0-9]{8,15}" dir="ltr" /></label>
          <label>البريد الإلكتروني<input v-model="joinForm.email" type="email" maxlength="120" dir="ltr" /></label>
        </div>
      </fieldset>
      <fieldset class="saf-group">
        <legend>3. العنوان</legend>
        <div class="saf-grid"><label class="wide">عنوان المحل بالتفصيل *<textarea v-model="joinForm.address" required minlength="8" maxlength="180" rows="2" /></label></div>
      </fieldset>
      <fieldset class="saf-group">
        <legend>4. بيانات المستندات <small>خاصة، تتشاف للإدارة فقط</small></legend>
        <div class="saf-grid">
          <label>رقم السجل التجاري<input v-model="joinForm.registrationNumber" maxlength="40" dir="ltr" /></label>
          <label>رقم البطاقة الضريبية<input v-model="joinForm.taxNumber" maxlength="40" dir="ltr" /></label>
        </div>
      </fieldset>
      <button :disabled="busy" class="saf-save">{{ app ? 'حفظ التعديلات' : 'إرسال طلب انضمام' }}</button>
    </form>

    <template v-if="app && editable && app.state === 'PENDING'">
      <fieldset class="saf-group">
        <legend>5. صور المحل <small>تظهر للعملاء</small></legend>
        <ShopPhotoManager scope="application" :photos="app.photos || []" @changed="personal" />
      </fieldset>
      <fieldset class="saf-group">
        <legend>6. مستندات خاصة <small>لا تظهر للعملاء ولا تتنشر</small></legend>
        <div class="saf-docs">
          <div v-for="[k, l, h] in kinds" :key="k" class="saf-doc">
            <b>{{ l }}</b><small>{{ h }}</small>
            <span v-if="docOf(k)" class="saf-file">{{ docOf(k).originalName }} <button type="button" class="saf-x" @click="delDoc(docOf(k))">حذف</button></span>
            <label class="saf-up">{{ docOf(k) ? 'استبدال' : 'رفع الملف' }}<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" @change="upDoc($event, k)" /></label>
          </div>
        </div>
        <p v-if="docErr" class="saf-err" role="alert">{{ docErr }}</p>
      </fieldset>
    </template>
    <p v-else-if="!app && editable" class="muted">بعد إرسال الطلب تقدر ترفع صور المحل والمستندات.</p>
  </section>
</template>

<style scoped>
.saf-form,.saf-group{display:grid;gap:12px}
.saf-group{border:1px solid #d8e0ea;border-radius:16px;padding:14px 16px;margin:12px 0 0;min-width:0}
.saf-group legend{font-weight:800;padding:0 8px;font-size:17px}.saf-group legend small{font-weight:400;color:#5b6b80;font-size:13px;margin-inline-start:8px}
.saf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px}
.saf-grid label{display:grid;gap:4px;font-weight:600;font-size:14px;align-content:start}.saf-grid label.wide{grid-column:1/-1}
.saf-grid small{font-weight:400;color:#5b6b80}
@media(max-width:700px){.saf-grid{grid-template-columns:1fr}}
@media(min-width:1200px){.saf-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.saf-grid label.wide{grid-column:span 2}}
.saf-docs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.saf-doc{display:grid;gap:6px;border:1px dashed #b9c6d8;border-radius:12px;padding:12px;align-content:start}.saf-doc small{color:#5b6b80}
.saf-file{font-size:13px;word-break:break-all}.saf-x{color:#b3261e;background:none;border:0;padding:0 6px;text-decoration:underline}
.saf-up{display:inline-flex;justify-content:center;align-items:center;min-height:42px;border-radius:12px;background:#eaf1fc;color:#0b5bd3;font-weight:700;cursor:pointer}.saf-up input{display:none}
.saf-err{color:#b3261e}.saf-save{justify-self:start;min-width:200px}
</style>
