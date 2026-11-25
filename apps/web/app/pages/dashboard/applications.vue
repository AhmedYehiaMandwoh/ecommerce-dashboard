<script setup lang="ts">
import { Store, FileText, Phone, Check, X, XCircle } from "lucide-vue-next";
const { applicationReasons, base, busy, dash, decideShopApplication, imageUrl, suspendShopApplication, token, user } = useMarket();
const docLabel: Record<string, string> = { REGISTRATION: "السجل التجاري", TAX: "البطاقة الضريبية", ID: "هوية صاحب المحل", OTHER: "مستند آخر" };
async function openDoc(d: any) {
  const res = await fetch(base + "/shop-documents/" + d.id, { headers: { Authorization: "Bearer " + token.value } });
  if (!res.ok) return;
  const url = URL.createObjectURL(await res.blob()); window.open(url, "_blank"); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const tab = ref("PENDING");
const states = [["PENDING", "طلبات جديدة"], ["APPROVED", "نشط"], ["SUSPENDED", "موقوف"], ["REJECTED", "مرفوض"]];
const count = (s: string) => (dash.value.shopApplications || []).filter((a: any) => a.state === s).length;
const list = computed(() => (dash.value.shopApplications || []).filter((a: any) => a.state === tab.value));
</script>

<template>
  <div v-if="user.role === 'ADMIN'" class="space-y-2">
    <Tabs v-model="tab" dir="rtl">
      <TabsList class="grid! h-auto w-full grid-cols-2 gap-1 rounded-2xl p-1 sm:grid-cols-4"><TabsTrigger v-for="[s, l] in (states as [string, string][])" :key="s" :value="s as string" class="min-w-0 gap-1 px-1 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{{ l }} <Badge variant="secondary" class="px-1.5 text-xs">{{ count(s) }}</Badge></TabsTrigger></TabsList>
    </Tabs>
    <p class="text-xs text-muted-foreground">راجع بيانات النشاط وتواصل مع مقدم الطلب قبل الموافقة. لا يوجد تحقق آلي من المستندات.</p>
    <p v-if="!list.length" class="text-muted-foreground">لا توجد طلبات في هذه القائمة.</p>
    <div class="grid grid-cols-1 items-start gap-3 md:grid-cols-2 2xl:grid-cols-3 [&>*]:min-w-0">
    <Card v-for="a in list" :key="a.id" class="gap-1 px-3 py-3">
      <div class="flex items-center gap-3"><div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary"><Store class="size-6 text-primary" /></div><div class="min-w-0 flex-1 break-words"><h3 class="font-extrabold">{{ a.name }}</h3><p class="text-sm text-muted-foreground">{{ a.city }} • {{ a.address }}</p></div><Badge class="shrink-0">{{ ({ PENDING: "طلب جديد", APPROVED: "نشط", SUSPENDED: "موقوف", REJECTED: "مرفوض" } as any)[a.state] || a.state }}</Badge></div>
      <div class="mt-1 divide-y text-sm">
        <div class="space-y-0.5 py-1"><h4 class="flex items-center gap-2 font-extrabold"><Store class="size-4 text-primary" /> بيانات المتجر</h4>
          <p>اسم المتجر: <b>{{ a.name }}</b></p><p>المدينة: <b>{{ a.city }}</b><template v-if="a.district"> • {{ a.district }}</template></p>
          <p>العنوان: <b>{{ a.address }}</b></p><p v-if="a.workingHours">مواعيد العمل: <b>{{ a.workingHours }}</b></p>
          <p v-if="a.description">النبذة: <b>{{ a.description }}</b></p><p class="flex items-start gap-2"><FileText class="mt-0.5 size-4 shrink-0" /> <span>تفاصيل النشاط: {{ a.details }}</span></p></div>
        <div v-if="a.photos && a.photos.length" class="py-1"><h4 class="font-extrabold">صور المتجر (تظهر للعملاء)</h4><div class="mt-1 grid grid-cols-3 gap-2"><div v-for="p in a.photos" :key="p.id" class="relative"><img :src="imageUrl(p.url)" :alt="'صورة ' + a.name" class="aspect-[4/3] w-full rounded-lg object-cover" /><span v-if="p.demo" class="absolute bottom-1 start-1 rounded bg-black/70 px-1 text-[10px] text-white">صورة تجريبية</span></div></div></div>
        <div class="space-y-0.5 py-1"><h4 class="flex items-center gap-2 font-extrabold"><FileText class="size-4 text-primary" /> المستندات (خاصة)</h4>
          <p v-if="a.registrationNumber">رقم السجل التجاري: <b dir="ltr">{{ a.registrationNumber }}</b></p><p v-if="a.taxNumber">رقم البطاقة الضريبية: <b dir="ltr">{{ a.taxNumber }}</b></p>
          <p v-for="d in a.documents || []" :key="d.id" class="flex items-center gap-2"><Check class="size-4 text-accent" /> {{ docLabel[d.kind] || d.kind }}: <button type="button" class="underline" @click="openDoc(d)">{{ d.originalName }}</button></p>
          <p v-if="!(a.documents || []).length" class="flex items-center gap-2 text-muted-foreground"><XCircle class="size-4" /> لم يتم رفع مستندات</p></div>
        <div class="space-y-0.5 py-1"><h4 class="flex items-center gap-2 font-extrabold"><Phone class="size-4 text-primary" /> تفاصيل التواصل (للإدارة فقط)</h4>
          <p v-if="a.contactName">المسؤول: <b>{{ a.contactName }}</b></p><p>رقم الجوال: <b dir="ltr">{{ a.phone }}</b></p>
          <p v-if="a.whatsapp">واتساب: <b dir="ltr">{{ a.whatsapp }}</b></p><p v-if="a.email">البريد الإلكتروني: <b dir="ltr">{{ a.email }}</b></p></div>
      </div>
      <div v-if="a.state === 'PENDING'" class="sticky bottom-[84px] z-10 mt-1 space-y-1 bg-card pb-1 md:static">
        <Label :for="'r-' + a.id">سبب قرار الانضمام</Label>
        <Textarea :id="'r-' + a.id" v-model="applicationReasons[a.id]" rows="1" class="min-h-9" minlength="5" maxlength="180" />
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2"><Button class="bg-accent text-accent-foreground" :disabled="busy" @click="decideShopApplication(a, true)"><Check class="size-4" /> قبول وتفعيل المتجر</Button><Button variant="outline" :disabled="busy" @click="decideShopApplication(a, false)"><X class="size-4" /> رفض</Button></div>
      </div>
      <div v-if="a.state === 'APPROVED' || a.state === 'SUSPENDED'" class="mt-1 space-y-1">
        <Label :for="'s-' + a.id">{{ a.state === 'APPROVED' ? 'سبب إيقاف المتجر' : 'سبب إعادة التفعيل' }}</Label>
        <Textarea :id="'s-' + a.id" v-model="applicationReasons[a.id]" rows="1" class="min-h-9" minlength="5" maxlength="180" />
        <Button v-if="a.state === 'APPROVED'" variant="outline" class="w-full" :disabled="busy || (applicationReasons[a.id] || '').trim().length < 5" @click="suspendShopApplication(a, true)">إيقاف المتجر</Button>
        <Button v-else class="w-full bg-accent text-accent-foreground" :disabled="busy || (applicationReasons[a.id] || '').trim().length < 5" @click="suspendShopApplication(a, false)">إعادة تفعيل المتجر</Button>
      </div>
    </Card>
    </div>
  </div>
  <p v-else class="text-muted-foreground">هذه الصفحة للإدارة فقط.</p>
</template>
