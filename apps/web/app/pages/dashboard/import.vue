<script setup lang="ts">
const { busy, createOffer, createProduct, createShop, csv, dash, dashboardTab, doImport, importFile, importHistory, importResult, importShop, loadImportHistory, newShop, offerForm, productForm } = useMarket();
</script>

<template>
  <div>
<template v-if="dashboardTab === 'import'">
        <div class="two section-gap">
          <div class="card">
            <h2>استيراد عروض CSV</h2>
            <p class="muted">
              حتى ١٠٠٠ صف للدفعة. الكمية لقطة مطلقة وليست زيادة. المعاينة مرتبطة بنفس الملف والمتجر لمدة ٣٠ دقيقة، وتغيّر المخزون يطلب معاينة جديدة. الكتالوج المعتمد لازم يكون موجود. الأعمدة:
              sku,brand,part_number,price_minor,stock. السعر بالقرش. المعاينة لا
              تحفظ.
            </p>
            <select v-model="importShop">
              <option v-for="s in dash.shops" :key="s.id" :value="s.id">
                {{ s.name }}
              </option></select
            ><input
              class="section-gap"
              type="file"
              accept=".csv,text/csv"
              @change="importFile"
            /><textarea
              v-model="csv"
              rows="5"
              dir="ltr"
              placeholder="sku,brand,part_number,price_minor,stock"
              @input="importResult = null"
            />
            <div class="row section-gap">
              <button
                :disabled="busy || !csv || !importShop"
                @click="doImport(false)"
              >
                معاينة</button
              ><button
                class="orange"
                :disabled="busy || !importResult || importResult.invalid > 0"
                @click="doImport(true)"
              >
                تأكيد الاستيراد
              </button>
            </div>
            <button class="alt" :disabled="!importShop || busy" @click="loadImportHistory">سجل الاستيراد</button><div v-for="job in importHistory" :key="job.id" class="line"><small dir="ltr">{{job.fileHash.slice(0,16)}} • {{job.state}} • {{job.total}} rows</small></div>
            <pre v-if="importResult" style="overflow: auto; font-size: 12px">{{
              JSON.stringify(importResult, null, 2)
            }}</pre>
          </div>
          <div class="card">
            <h2>إضافة عرض لصنف موجود</h2>
            <form class="form" @submit.prevent="createOffer">
              <label
                >المتجر<select v-model="importShop">
                  <option v-for="s in dash.shops" :key="s.id" :value="s.id">
                    {{ s.name }}
                  </option>
                </select></label
              ><label
                >معرف المنتج<input
                  v-model="offerForm.productId"
                  required /></label
              ><label
                >كود التاجر SKU<input v-model="offerForm.sku" required /></label
              ><label
                >السعر بالقرش<input
                  v-model.number="offerForm.price"
                  type="number"
                  min="1"
                  required /></label
              ><label
                >الكمية<input
                  v-model.number="offerForm.stock"
                  type="number"
                  min="0"
                  required /></label
              ><button :disabled="busy">إضافة العرض</button>
            </form>
          </div>
        </div>
        <div class="two section-gap">
          <div class="card">
            <h2>طلب إضافة منتج للكتالوج</h2>
            <form class="form" @submit.prevent="createProduct">
              <label
                >الماركة<input v-model="productForm.brand" required /></label
              ><label
                >رقم القطعة<input
                  v-model="productForm.partNumber"
                  required /></label
              ><label
                >اسم المنتج<input v-model="productForm.title" required /></label
              ><label
                >القسم<input v-model="productForm.category" required /></label
              ><label
                >الوصف<textarea
                  v-model="productForm.description"
                  required
                /></label
              ><button :disabled="busy">إرسال للمراجعة</button>
            </form>
          </div>
          <div class="card">
            <h2>إضافة متجر</h2>
            <form class="form" @submit.prevent="createShop">
              <label>اسم المتجر<input v-model="newShop.name" required /></label
              ><label>المدينة<input v-model="newShop.city" required /></label
              ><button :disabled="busy">إضافة للمراجعة</button>
            </form>
          </div>
        </div>
        </template>
  </div>
</template>
