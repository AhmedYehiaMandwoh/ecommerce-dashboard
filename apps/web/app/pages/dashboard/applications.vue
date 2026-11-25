<script setup lang="ts">
import { Store, FileText, Phone, Check, X, XCircle } from "lucide-vue-next";
const { applicationReasons, busy, dash, decideShopApplication, suspendShopApplication, user } = useMarket();
const tab = ref("PENDING");
const states = [["PENDING", "طلبات جديدة"], ["APPROVED", "نشط"], ["SUSPENDED", "موقوف"], ["REJECTED", "مرفوض"]];
const count = (s: string) => (dash.value.shopApplications || []).filter((a: any) => a.state === s).length;
const list = computed(() => (dash.value.shopApplications || []).filter((a: any) => a.state === tab.value));
</script>

<template>
  <div v-if="user.role === 'ADMIN'" class="space-y-2">
    <Tabs v-model="tab" dir="rtl">
      <TabsList class="w-full"><TabsTrigger v-for="[s, l] in (states as [string, string][])" :key="s" :value="s as string" class="gap-1 px-1 text-xs">{{ l }} <Badge variant="secondary" class="px-1.5 text-[10px]">{{ count(s) }}</Badge></TabsTrigger></TabsList>
    </Tabs>
    <p class="text-xs text-muted-foreground">راجع بيانات النشاط وتواصل مع مقدم الطلب قبل الموافقة. لا يوجد تحقق آلي من المستندات.</p>
    <p v-if="!list.length" class="text-muted-foreground">لا توجد طلبات في هذه القائمة.</p>
    <Card v-for="a in list" :key="a.id" class="gap-2 p-3">
      <div class="flex items-center gap-3"><div class="flex size-12 items-center justify-center rounded-xl bg-secondary"><Store class="size-6 text-primary" /></div><div class="flex-1"><h3 class="font-extrabold">{{ a.name }}</h3><p class="text-sm text-muted-foreground">{{ a.city }} • {{ a.address }}</p></div><Badge>{{ ({ PENDING: "طلب جديد", APPROVED: "نشط", REJECTED: "مرفوض" } as any)[a.state] || a.state }}</Badge></div>
      <div class="mt-3 divide-y text-sm">
        <div class="space-y-0.5 py-1.5"><h4 class="flex items-center gap-2 font-extrabold"><Store class="size-4 text-primary" /> بيانات المتجر</h4><p>اسم المتجر: <b>{{ a.name }}</b></p><p class="flex items-start gap-2"><FileText class="mt-0.5 size-4" /> {{ a.details }}</p></div>
        <div class="space-y-0.5 py-1.5"><h4 class="flex items-center gap-2 font-extrabold"><FileText class="size-4 text-primary" /> المستندات</h4>
          <p class="flex items-center gap-2 text-destructive"><XCircle class="size-4" /> الهوية / السجل التجاري: غير متوفر</p>
          <p class="flex items-center gap-2 text-destructive"><XCircle class="size-4" /> عقد الإيجار: غير متوفر</p>
          </div>
        <div class="space-y-0.5 py-1.5"><h4 class="flex items-center gap-2 font-extrabold"><Phone class="size-4 text-primary" /> تفاصيل التواصل</h4>
          <p>رقم الجوال: <b dir="ltr">{{ a.phone }}</b></p>
          <p class="flex items-center gap-2 text-destructive"><XCircle class="size-4" /> البريد الإلكتروني: غير متوفر</p></div>
      </div>
      <div v-if="a.state === 'PENDING'" class="mt-1 space-y-1">
        <Label :for="'r-' + a.id">سبب قرار الانضمام</Label>
        <Textarea :id="'r-' + a.id" v-model="applicationReasons[a.id]" rows="1" class="min-h-9" minlength="5" maxlength="180" />
        <div class="grid grid-cols-2 gap-3"><Button class="bg-accent text-accent-foreground" :disabled="busy" @click="decideShopApplication(a, true)"><Check class="size-4" /> قبول وتفعيل المتجر</Button><Button variant="outline" :disabled="busy" @click="decideShopApplication(a, false)"><X class="size-4" /> رفض</Button></div>
      </div>
      <div v-if="a.state === 'APPROVED' || a.state === 'SUSPENDED'" class="mt-1 space-y-1">
        <Label :for="'s-' + a.id">{{ a.state === 'APPROVED' ? 'سبب إيقاف المتجر' : 'سبب إعادة التفعيل' }}</Label>
        <Textarea :id="'s-' + a.id" v-model="applicationReasons[a.id]" rows="1" class="min-h-9" minlength="5" maxlength="180" />
        <Button v-if="a.state === 'APPROVED'" variant="outline" class="w-full" :disabled="busy || (applicationReasons[a.id] || '').trim().length < 5" @click="suspendShopApplication(a, true)">إيقاف المتجر</Button>
        <Button v-else class="w-full bg-accent text-accent-foreground" :disabled="busy || (applicationReasons[a.id] || '').trim().length < 5" @click="suspendShopApplication(a, false)">إعادة تفعيل المتجر</Button>
      </div>
    </Card>
  </div>
  <p v-else class="text-muted-foreground">هذه الصفحة للإدارة فقط.</p>
</template>
