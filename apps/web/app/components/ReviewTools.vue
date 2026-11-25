<script setup lang="ts">
const { t } = useI18n();
const { api, approve, busy, catalogEditor, dash, deleteFitment, editCatalog, fitmentForm, imageUrl, run, saveCatalog, saveFitment, uploadCatalogImage, user } = useMarket();
const makeMerchant = (u: any) => run(async () => { await api("/admin/users/" + u.id + "/merchant", "PATCH"); dash.value = await api("/dashboard"); });
</script>

<template>
  <div v-if="user.role === 'ADMIN'" class="space-y-6">
    <section class="space-y-3">
      <h2 class="text-lg font-extrabold">{{ t('مراجعة الكتالوج') }}</h2>
      <Card class="p-4">
        <Table>
          <TableHeader><TableRow><TableHead>{{ t('المنتج') }}</TableHead><TableHead>{{ t('المعرف') }}</TableHead><TableHead>{{ t('الحالة') }}</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="p in dash.products" :key="p.id">
              <TableCell>{{ p.brand }} • {{ p.partNumber }}<p class="text-sm text-muted-foreground">{{ p.title }}</p><Button size="sm" variant="outline" class="mt-1" @click="editCatalog(p)">{{ t('تحرير المنتج') }}</Button></TableCell>
              <TableCell><span class="text-xs text-muted-foreground" dir="ltr">{{ p.id.slice(0, 8) }}</span></TableCell>
              <TableCell><Button size="sm" :variant="p.approved ? 'outline' : 'default'" @click="approve('products', p.id, !p.approved)">{{ p.approved ? t('إيقاف') : t('اعتماد') }}</Button></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </section>

    <Card v-if="catalogEditor" class="space-y-4 p-5">
      <h2 class="text-lg font-extrabold">{{ t('تحرير المنتج') }}</h2>
      <p class="font-bold">{{ catalogEditor.brand }} • {{ catalogEditor.partNumber }}</p>
      <p class="text-sm text-muted-foreground">{{ t('الهوية ثابتة. تغير العبوة أو رقم القطعة يحتاج منتجًا جديدًا. تعديل البيانات أو الصورة يوقف الاعتماد لحين المراجعة.') }}</p>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <div class="space-y-2">
          <img :src="imageUrl(catalogEditor.image)" :alt="t('صورة المنتج')" class="h-32 w-40 rounded-lg border object-contain" />
          <Label>{{ t('صورة المنتج') }}</Label><Input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadCatalogImage" />
          <p class="text-xs text-muted-foreground">{{ t('JPEG أو PNG أو WebP حتى ٥ ميجابايت. ارفع صورًا تملك حق استخدامها فقط.') }}</p>
          <form class="space-y-2" @submit.prevent="saveCatalog">
            <Label>{{ t('عنوان المنتج') }}</Label><Input v-model="catalogEditor.title" required />
            <Label>{{ t('قسم المنتج') }}</Label><Input v-model="catalogEditor.category" required />
            <Label>{{ t('وصف المنتج') }}</Label><Textarea v-model="catalogEditor.description" />
            <Button type="submit" class="w-full" :disabled="busy">{{ t('حفظ تفاصيل المنتج') }}</Button>
          </form>
        </div>
        <div class="space-y-2">
          <h3 class="font-extrabold">{{ t('توافق المركبات') }}</h3>
          <p class="text-sm text-muted-foreground">{{ t('لا تعتمد توافقًا من التخمين. التوافق المعتمد فقط يظهر للعملاء وفي البحث.') }}</p>
          <div v-for="f in catalogEditor.fitments" :key="f.id" class="flex items-center justify-between gap-2 border-t pt-2 text-sm">
            <span>{{ f.make }} {{ f.model }} {{ f.fromYear }}-{{ f.toYear }} {{ f.engine }}</span>
            <Badge :variant="f.verified ? 'default' : 'secondary'">{{ f.verified ? t('معتمد') : t('غير معتمد') }}</Badge>
            <Button size="sm" variant="destructive" @click="deleteFitment(f.id)">{{ t('حذف التوافق') }}</Button>
          </div>
          <form class="space-y-2 border-t pt-3" @submit.prevent="saveFitment">
            <Label>{{ t('ماركة التوافق') }}</Label><Input v-model="fitmentForm.make" required />
            <Label>{{ t('موديل التوافق') }}</Label><Input v-model="fitmentForm.model" required />
            <div class="grid grid-cols-2 gap-3"><div><Label>{{ t('من سنة') }}</Label><Input v-model.number="fitmentForm.fromYear" type="number" min="1950" max="2100" /></div><div><Label>{{ t('إلى سنة') }}</Label><Input v-model.number="fitmentForm.toYear" type="number" min="1950" max="2100" /></div></div>
            <Label>{{ t('محرك التوافق') }}</Label><Input v-model="fitmentForm.engine" required />
            <label class="flex items-center gap-2 text-sm"><input v-model="fitmentForm.verified" type="checkbox" class="size-4 accent-[#ff7a00]" /> {{ t('تمت مراجعة مصدر التوافق') }}</label>
            <Button type="submit" class="w-full" :disabled="busy">{{ t('حفظ التوافق') }}</Button>
          </form>
        </div>
      </div>
    </Card>

    <section class="space-y-3">
      <h2 class="text-lg font-extrabold">{{ t('الحسابات') }}</h2>
      <Card class="p-4">
        <Table>
          <TableHeader><TableRow><TableHead>{{ t('الاسم') }}</TableHead><TableHead>{{ t('البريد') }}</TableHead><TableHead>{{ t('الدور') }}</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="u in dash.users" :key="u.id">
              <TableCell>{{ u.name }}</TableCell><TableCell dir="ltr">{{ u.email }}</TableCell><TableCell><Badge variant="secondary">{{ u.role }}</Badge></TableCell>
              <TableCell><Button v-if="u.role === 'CUSTOMER'" size="sm" variant="outline" :disabled="busy" @click="makeMerchant(u)">{{ t('تحويل لتاجر') }}</Button></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </section>
  </div>
</template>
