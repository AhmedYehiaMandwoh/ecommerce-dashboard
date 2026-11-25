<script setup lang="ts">
import { Info, MessageSquare } from "lucide-vue-next";
const { api, approve, busy, dash, editCatalog, imageUrl, tickets, user } = useMarket();
const tab = ref("products");
const pending = computed(() => (dash.value.products || []).filter((p: any) => !p.approved));
const open = computed(() => (tickets.value || []).filter((t: any) => t.state === "OPEN"));
onMounted(async () => { try { tickets.value = await api("/support-tickets"); } catch {} });
const router = useRouter();
const edit = (p: any) => { editCatalog(p); router.push("/dashboard/catalog"); };
</script>

<template>
  <div v-if="user.role === 'ADMIN'" class="space-y-2">
    <Tabs v-model="tab">
      <TabsList class="h-12 w-full gap-1 rounded-2xl p-1">
        <TabsTrigger value="complaints" class="text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">الشكاوى <Badge variant="secondary" class="mr-2">{{ open.length }}</Badge></TabsTrigger>
        <TabsTrigger value="products" class="text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">المنتجات <Badge class="mr-2 bg-accent text-accent-foreground">{{ pending.length }}</Badge></TabsTrigger>
      </TabsList>
    </Tabs>
    <template v-if="tab === 'products'">
      <p v-if="!pending.length" class="text-muted-foreground">لا توجد منتجات بانتظار المراجعة.</p>
      <Card v-for="p in pending" :key="p.id" class="gap-3 p-3">
        <div class="flex gap-3">
          <div class="min-w-0 flex-1 space-y-1"><h3 class="text-lg font-extrabold">{{ p.title }}</h3><p class="text-sm text-muted-foreground">{{ p.brand }} • {{ p.partNumber }}</p><Badge variant="outline" class="border-accent text-accent">بانتظار المراجعة</Badge></div>
          <img :src="imageUrl(p.image || '/assets/shop-icon.png')" alt="" class="size-24 shrink-0 rounded-xl bg-secondary object-contain" />
        </div>
        <div class="grid grid-cols-3 gap-2"><Button class="bg-accent text-accent-foreground" size="lg" :disabled="busy" @click="approve('products', p.id, true)">قبول</Button><Button variant="outline" size="lg" class="border-accent text-accent" @click="edit(p)">طلب تعديل</Button><Button variant="outline" size="lg" class="text-primary" @click="edit(p)">عرض</Button></div>
      </Card>
      <NuxtLink v-if="open[0]" to="/dashboard/support"><Card class="flex-row items-center gap-3 bg-orange-50 p-3"><MessageSquare class="size-7 text-primary" /><div class="flex-1"><div class="font-bold">{{ open[0].subject }}</div><div class="text-xs text-muted-foreground">{{ open[0].message.slice(0, 60) }}</div></div></Card></NuxtLink>
    </template>
    <template v-else>
      <p v-if="!open.length" class="text-muted-foreground">لا توجد شكاوى مفتوحة.</p>
      <NuxtLink v-for="t in open" :key="t.id" to="/dashboard/support"><Card class="mb-2 flex-row items-center gap-3 bg-orange-50 p-4"><MessageSquare class="size-8 text-primary" /><div class="flex-1"><div class="font-bold">{{ t.subject }}</div><div class="text-xs text-muted-foreground">{{ t.message.slice(0, 80) }}</div></div><Badge class="bg-accent text-accent-foreground">مفتوح</Badge></Card></NuxtLink>
    </template>
    <p class="flex items-center gap-2 text-xs text-muted-foreground"><Info class="size-4" /> بيانات تجريبية للاختبار.</p>
    <NuxtLink to="/dashboard/catalog" class="inline-block text-sm font-bold text-primary">أدوات الكتالوج والحسابات التفصيلية ←</NuxtLink>
  </div>
  <p v-else class="text-muted-foreground">هذه الصفحة للإدارة فقط.</p>
</template>
