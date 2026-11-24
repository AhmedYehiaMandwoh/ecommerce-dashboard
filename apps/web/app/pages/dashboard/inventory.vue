<script setup lang="ts">
const { approve, busy, dash, saveOffer, user } = useMarket();
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-lg font-extrabold">المتاجر والمخزون</h2>
    <Card v-for="s in dash.shops" :key="s.id" class="space-y-3 p-5">
      <div class="flex items-center gap-3"><h3 class="flex-1 font-extrabold">{{ s.name }}</h3><Badge :variant="s.approved ? 'default' : 'secondary'">{{ s.approved ? "معتمد" : "بانتظار الاعتماد" }}</Badge>
        <Button v-if="user.role === 'ADMIN'" size="sm" variant="outline" @click="approve('shops', s.id, !s.approved)">{{ s.approved ? "إيقاف" : "اعتماد" }}</Button></div>
      <p v-if="!s.offers.length" class="text-sm text-muted-foreground">لا توجد عروض.</p>
      <div v-else class="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>المنتج / الكود</TableHead><TableHead>السعر بالقرش</TableHead><TableHead>المخزون</TableHead><TableHead>نشط</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="o in s.offers" :key="o.id">
              <TableCell>{{ o.product.title }}<p class="text-xs text-muted-foreground">{{ o.sku }}</p></TableCell>
              <TableCell><Input v-model.number="o.price" type="number" min="1" class="w-28" /></TableCell>
              <TableCell><Input v-model.number="o.stock" type="number" min="0" class="w-24" /></TableCell>
              <TableCell><input v-model="o.active" type="checkbox" class="size-4 accent-[#ff7a00]" /></TableCell>
              <TableCell><Button size="sm" :disabled="busy" @click="saveOffer(o)">حفظ</Button></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  </div>
</template>
