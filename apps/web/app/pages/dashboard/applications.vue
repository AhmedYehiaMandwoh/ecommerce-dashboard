<script setup lang="ts">
import { Store, FileText, Phone, Check, X } from "lucide-vue-next";
const { applicationReasons, busy, dash, decideShopApplication, user } = useMarket();
const tab = ref("PENDING");
const states = [["PENDING", "طلبات جديدة"], ["APPROVED", "نشط"], ["REJECTED", "مرفوض"]];
const count = (s: string) => (dash.value.shopApplications || []).filter((a: any) => a.state === s).length;
const list = computed(() => (dash.value.shopApplications || []).filter((a: any) => a.state === tab.value));
</script>

<template>
  <div v-if="user.role === 'ADMIN'" class="space-y-4">
    <Tabs v-model="tab">
      <TabsList class="w-full"><TabsTrigger v-for="[s, l] in states" :key="s" :value="s">{{ l }} <Badge variant="secondary" class="mr-2">{{ count(s) }}</Badge></TabsTrigger></TabsList>
    </Tabs>
    <p class="text-sm text-muted-foreground">راجع بيانات النشاط وتواصل مع مقدم الطلب قبل الموافقة. لا يوجد تحقق آلي من المستندات.</p>
    <p v-if="!list.length" class="text-muted-foreground">لا توجد طلبات في هذه القائمة.</p>
    <Card v-for="a in list" :key="a.id" class="p-5">
      <div class="flex items-center gap-3"><div class="flex size-12 items-center justify-center rounded-xl bg-secondary"><Store class="size-6 text-primary" /></div><div class="flex-1"><h3 class="font-extrabold">{{ a.name }}</h3><p class="text-sm text-muted-foreground">{{ a.city }} • {{ a.address }}</p></div><Badge>{{ a.state }}</Badge></div>
      <div class="mt-3 space-y-1 text-sm"><p class="flex items-center gap-2"><Phone class="size-4" /> <span dir="ltr">{{ a.phone }}</span></p><p class="flex items-start gap-2"><FileText class="mt-0.5 size-4" /> {{ a.details }}</p></div>
      <div v-if="a.state === 'PENDING'" class="mt-3 space-y-2">
        <Label :for="'r-' + a.id">سبب قرار الانضمام</Label>
        <Textarea :id="'r-' + a.id" v-model="applicationReasons[a.id]" minlength="5" maxlength="180" />
        <div class="grid grid-cols-2 gap-3"><Button class="bg-accent text-accent-foreground" :disabled="busy" @click="decideShopApplication(a, true)"><Check class="size-4" /> قبول وتفعيل المتجر</Button><Button variant="outline" :disabled="busy" @click="decideShopApplication(a, false)"><X class="size-4" /> رفض</Button></div>
      </div>
    </Card>
  </div>
  <p v-else class="text-muted-foreground">هذه الصفحة للإدارة فقط.</p>
</template>
