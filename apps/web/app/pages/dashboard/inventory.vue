<script setup lang="ts">
const { approve, dash, dashboardTab, saveOffer, shops, user } = useMarket();
</script>

<template>
  <div>
<template v-if="dashboardTab === 'inventory'"><h2>المتاجر والمخزون</h2>
        <div v-for="s in dash.shops" :key="s.id" class="card section-gap">
          <div class="row between">
            <h3>{{ s.name }}</h3>
            <span class="badge">{{
              s.approved ? "معتمد" : "بانتظار الاعتماد"
            }}</span
            ><button
              v-if="user.role === 'ADMIN'"
              class="alt"
              @click="approve('shops', s.id, !s.approved)"
            >
              {{ s.approved ? "إيقاف" : "اعتماد" }}
            </button>
          </div>
          <div class="scroll">
            <table>
              <thead>
                <tr>
                  <th>المنتج / الكود</th>
                  <th>السعر بالقرش</th>
                  <th>المخزون</th>
                  <th>نشط</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="o in s.offers" :key="o.id">
                  <td>
                    {{ o.product.title }}<br /><small>{{ o.sku }}</small>
                  </td>
                  <td>
                    <input
                      v-model.number="o.price"
                      type="number"
                      min="1"
                      style="width: 120px"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="o.stock"
                      type="number"
                      min="0"
                      style="width: 85px"
                    />
                  </td>
                  <td><input v-model="o.active" type="checkbox" /></td>
                  <td><button @click="saveOffer(o)">حفظ</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </template>
  </div>
</template>
