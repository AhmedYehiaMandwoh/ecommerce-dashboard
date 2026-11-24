<script setup lang="ts">
const { api, approve, busy, catalogEditor, dash, dashboard, dashboardTab, deleteFitment, editCatalog, fitmentForm, imageUrl, products, run, saveCatalog, saveFitment, uploadCatalogImage, user } = useMarket();
</script>

<template>
  <div>
<template v-if="user.role === 'ADMIN' && dashboardTab === 'review'"
          ><h2>مراجعة الكتالوج</h2>
          <div class="card scroll">
            <table>
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>المعرف</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in dash.products" :key="p.id">
                  <td>{{ p.brand }} • {{ p.partNumber }}<br />{{ p.title }}<button class="alt" @click="editCatalog(p)">تحرير المنتج</button></td>
                  <td>
                    <small>{{ p.id }}</small>
                  </td>
                  <td>
                    <button
                      :class="p.approved ? 'alt' : 'orange'"
                      @click="approve('products', p.id, !p.approved)"
                    >
                      {{ p.approved ? "إيقاف" : "اعتماد" }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <section v-if="catalogEditor" class="card section-gap catalog-editor"><h2>تحرير المنتج</h2><p>{{catalogEditor.brand}} • {{catalogEditor.partNumber}}</p><p class="muted">الهوية ثابتة. تغير العبوة أو رقم القطعة يحتاج منتجًا جديدًا. تعديل البيانات أو الصورة يوقف الاعتماد لحين المراجعة.</p><img :src="imageUrl(catalogEditor.image)" alt="صورة المنتج" style="width:160px;height:130px;object-fit:contain"/><label>صورة المنتج<input type="file" accept="image/png,image/jpeg,image/webp" @change="uploadCatalogImage"/></label><p class="muted">JPEG أو PNG أو WebP حتى ٥ ميجابايت. ارفع صورًا تملك حق استخدامها فقط.</p><form class="form" @submit.prevent="saveCatalog"><label>عنوان المنتج<input v-model="catalogEditor.title" required/></label><label>قسم المنتج<input v-model="catalogEditor.category" required/></label><label>وصف المنتج<textarea v-model="catalogEditor.description"/></label><button :disabled="busy">حفظ تفاصيل المنتج</button></form><h3>توافق المركبات</h3><p class="muted">لا تعتمد توافقًا من التخمين. التوافق المعتمد فقط يظهر للعملاء وفي البحث.</p><div v-for="f in catalogEditor.fitments" :key="f.id">{{f.make}} {{f.model}} {{f.fromYear}}-{{f.toYear}} {{f.engine}} • {{f.verified?'معتمد':'غير معتمد'}}<button class="danger" @click="deleteFitment(f.id)">حذف التوافق</button></div><form class="form" @submit.prevent="saveFitment"><label>ماركة التوافق<input v-model="fitmentForm.make" required/></label><label>موديل التوافق<input v-model="fitmentForm.model" required/></label><label>من سنة<input type="number" v-model.number="fitmentForm.fromYear" min="1950" max="2100"/></label><label>إلى سنة<input type="number" v-model.number="fitmentForm.toYear" min="1950" max="2100"/></label><label>محرك التوافق<input v-model="fitmentForm.engine" required/></label><label><input type="checkbox" v-model="fitmentForm.verified"/> تمت مراجعة مصدر التوافق</label><button :disabled="busy">حفظ التوافق</button></form></section>
          <h2>الحسابات</h2>
          <div class="card scroll">
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>البريد</th>
                  <th>الدور</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in dash.users" :key="u.id">
                  <td>{{ u.name }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.role }}</td>
                  <td>
                    <button
                      v-if="u.role === 'CUSTOMER'"
                      @click="
                        run(async () => {
                          await api(
                            '/admin/users/' + u.id + '/merchant',
                            'PATCH',
                          );
                          dash = await api('/dashboard');
                        })
                      "
                    >
                      تحويل لتاجر
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div></template
        >
  </div>
</template>
