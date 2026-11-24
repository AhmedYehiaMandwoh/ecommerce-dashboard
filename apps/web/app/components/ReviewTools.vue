<script setup lang="ts">
const { api, approve, busy, catalogEditor, dash, deleteFitment, editCatalog, fitmentForm, imageUrl, run, saveCatalog, saveFitment, uploadCatalogImage, user } = useMarket();
const makeMerchant = (u: any) => run(async () => { await api("/admin/users/" + u.id + "/merchant", "PATCH"); dash.value = await api("/dashboard"); });
</script>

<template>
  <div v-if="user.role === 'ADMIN'" class="space-y-6">
    <section class="space-y-3">
      <h2 class="text-lg font-extrabold">مراجعة الكتالوج</h2>
      <Card class="p-4">
        <Table>
          <TableHeader><TableRow><TableHead>المنتج</TableHead><TableHead>المعرف</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="p in dash.products" :key="p.id">
              <TableCell>{{ p.brand }} • {{ p.partNumber }}<p class="text-sm text-muted-foreground">{{ p.title }}</p><Button size="sm" variant="outline" class="mt-1" @click="editCatalog(p)">تحرير المنتج</Button></TableCell>
              <TableCell><span class="text-xs text-muted-foreground" dir="ltr">{{ p.id.slice(0, 8) }}</span></TableCell>
              <TableCell><Button size="sm" :variant="p.approved ? 'outline' : 'default'" @click="approve('products', p.id, !p.approved)">{{ p.approved ? "إيقاف" : "اعتماد" }}</Button></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </section>

    <Card v-if="catalogEditor" class="space-y-4 p-5">
      <h2 class="text-lg font-extrabold">تحرير المنتج</h2>
      <p class="font-bold">{{ catalogEditor.brand }} • {{ catalogEditor.partNumber }}</p>
      <p class="text-sm text-muted-foreground">الهوية ثابتة. تغير العبوة أو رقم القطعة يحتاج منتجًا جديدًا. تعديل البيانات أو الصورة يوقف الاعتماد لحين المراجعة.</p>
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-2">
          <img :src="imageUrl(catalogEditor.image)" alt="صورة المنتج" class="h-32 w-40 rounded-lg border object-contain" />
          <Label>صورة المنتج</Label><Input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadCatalogImage" />
          <p class="text-xs text-muted-foreground">JPEG أو PNG أو WebP حتى ٥ ميجابايت. ارفع صورًا تملك حق استخدامها فقط.</p>
          <form class="space-y-2" @submit.prevent="saveCatalog">
            <Label>عنوان المنتج</Label><Input v-model="catalogEditor.title" required />
            <Label>قسم المنتج</Label><Input v-model="catalogEditor.category" required />
            <Label>وصف المنتج</Label><Textarea v-model="catalogEditor.description" />
            <Button type="submit" class="w-full" :disabled="busy">حفظ تفاصيل المنتج</Button>
          </form>
        </div>
        <div class="space-y-2">
          <h3 class="font-extrabold">توافق المركبات</h3>
          <p class="text-sm text-muted-foreground">لا تعتمد توافقًا من التخمين. التوافق المعتمد فقط يظهر للعملاء وفي البحث.</p>
          <div v-for="f in catalogEditor.fitments" :key="f.id" class="flex items-center justify-between gap-2 border-t pt-2 text-sm">
            <span>{{ f.make }} {{ f.model }} {{ f.fromYear }}-{{ f.toYear }} {{ f.engine }}</span>
            <Badge :variant="f.verified ? 'default' : 'secondary'">{{ f.verified ? "معتمد" : "غير معتمد" }}</Badge>
            <Button size="sm" variant="destructive" @click="deleteFitment(f.id)">حذف التوافق</Button>
          </div>
          <form class="space-y-2 border-t pt-3" @submit.prevent="saveFitment">
            <Label>ماركة التوافق</Label><Input v-model="fitmentForm.make" required />
            <Label>موديل التوافق</Label><Input v-model="fitmentForm.model" required />
            <div class="grid grid-cols-2 gap-3"><div><Label>من سنة</Label><Input v-model.number="fitmentForm.fromYear" type="number" min="1950" max="2100" /></div><div><Label>إلى سنة</Label><Input v-model.number="fitmentForm.toYear" type="number" min="1950" max="2100" /></div></div>
            <Label>محرك التوافق</Label><Input v-model="fitmentForm.engine" required />
            <label class="flex items-center gap-2 text-sm"><input v-model="fitmentForm.verified" type="checkbox" class="size-4 accent-[#ff7a00]" /> تمت مراجعة مصدر التوافق</label>
            <Button type="submit" class="w-full" :disabled="busy">حفظ التوافق</Button>
          </form>
        </div>
      </div>
    </Card>

    <section class="space-y-3">
      <h2 class="text-lg font-extrabold">الحسابات</h2>
      <Card class="p-4">
        <Table>
          <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>البريد</TableHead><TableHead>الدور</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            <TableRow v-for="u in dash.users" :key="u.id">
              <TableCell>{{ u.name }}</TableCell><TableCell dir="ltr">{{ u.email }}</TableCell><TableCell><Badge variant="secondary">{{ u.role }}</Badge></TableCell>
              <TableCell><Button v-if="u.role === 'CUSTOMER'" size="sm" variant="outline" :disabled="busy" @click="makeMerchant(u)">تحويل لتاجر</Button></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </section>
  </div>
</template>
