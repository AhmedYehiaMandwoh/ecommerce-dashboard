<script setup lang="ts">
const { t } = useI18n();
const { busy, categories, category, fitmentVehicle, go, imageUrl, load, login, money, openProduct, page, pages, search, shopFilter, shops, user, vehicle, vehicles, view, visible, visualCategories } = useMarket();
</script>

<template>
  <div>
      <template v-if="view === 'home' || view === 'shops'">
        <div class="search">
          <input
            ref="searchInput"
            v-model="search"
            :aria-label="t('البحث باسم أو رقم القطعة')"
            :placeholder="t('بتدور على إيه؟ اسم القطعة، الماركة أو رقمها')"
            @keyup.enter="
              page = 1;
              load();
            "
          /><button
            @click="
              page = 1;
              load();
            "
          >
            {{ t('بحث') }}</button
          ><select v-model="shopFilter" :aria-label="t('اختيار المحل')" @change="page=1;load()">
            <option value="">{{ t('كل المحلات') }}</option>
            <option v-for="s in shops" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </div>
        <div v-if="view === 'shops'" class="store-discovery section-gap min-[1200px]:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] min-[1200px]:gap-[24px]">
          <div v-for="(s, n) in shops" :key="s.id" class="card store-discovery-card">
            <template v-if="s.photos && s.photos.length">
              <img class="store-cover h-auto aspect-[16/9] w-full object-cover block" :src="imageUrl((s.photos.find((p: any) => p.role === 'COVER') || s.photos[0]).url)" :alt="t('صورة {0}', s.name)" />
              <span v-if="(s.photos.find((p: any) => p.role === 'COVER') || s.photos[0]).demo" class="badge">{{ t('صورة تجريبية') }}</span>
              <div v-if="s.photos.length > 1" class="mx-[14px] mt-[10px] mb-[4px] grid grid-cols-4 gap-[8px]"><img v-for="p in s.photos.filter((x: any) => x.url !== (s.photos.find((q: any) => q.role === 'COVER') || s.photos[0]).url)" class="block aspect-[4/3] h-auto w-full rounded-[10px] object-cover" :key="p.id" :src="imageUrl(p.url)" :alt="t('صورة من ') + s.name" /></div>
            </template>
            <template v-else>
              <img class="store-cover h-auto aspect-[16/9] w-full object-cover block" :src="'/assets/shop-demo-'+((Number(n)%2)+1)+'.png'" :alt="t('تصور لمحل تجريبي، ليست صورة المحل الفعلي')" />
              <span class="badge">{{ t('متجر تجريبي') }}</span>
            </template>
            <h2>{{ s.name }}</h2>
            <p>{{ s.city }}<template v-if="s.district"> • {{ s.district }}</template></p>
            <p v-if="s.description" class="mx-[14px] my-[4px] text-[15px] leading-[1.6] text-[#334a63]">{{ s.description }}</p>
            <p v-if="s.workingHours" class="mx-[14px] mb-[10px] mt-[2px] text-[14px] text-[#5b6b80]">{{ t('مواعيد العمل:') }} {{ s.workingHours }}</p>
            <button @click="shopFilter = s.id; load(); ($refs.catalogGrid as any)?.scrollIntoView({behavior: 'smooth'});">{{ t('عرض المنتجات') }}</button>
          </div>
        </div>
        <section v-if="user && vehicles.length" class="card section-gap"><label>{{ t('تصفية حسب توافق معتمد لعربيتي') }}<select v-model="fitmentVehicle" @change="page=1;load()"><option value="">{{ t('كل المنتجات بدون تأكيد توافق') }}</option><option v-for="v in vehicles" :key="v.id" :value="v.id">{{v.make}} {{v.model}} {{v.year}} {{v.engine}}</option></select></label><p class="muted">{{ t('النتائج تعتمد فقط على سجلات توافق راجعتها الإدارة. عدم وجود نتيجة لا يعني أن القطعة غير مناسبة. راجع رقم القطعة مع البائع.') }}</p></section>
        <div class="chips">
          <button
            :class="{ on: !category }"
            @click="
              category = '';
              page = 1;
              load();
            "
          >
            {{ t('كل الأقسام') }}</button
          ><button
            v-for="c in categories"
            :key="c"
            :class="{ on: category === c }"
            @click="
              category = c;
              page = 1;
              load();
            "
          >
            {{ c }}
          </button>
        </div>
        <div class="row between">
          <h2>{{ t('قطع تختار منها') }}</h2>
          <span class="muted">{{ t('راجع رقم القطعة والتوافق قبل الشراء الحقيقي') }}</span>
        </div>
        <div v-if="!visible.length && !busy" class="empty">
          {{ t('مفيش منتجات مطابقة. جرّب بحث تاني.') }}
        </div>
        <div ref="catalogGrid" class="grid catalog-grid">
          <article v-for="p in visible" :key="p.id" class="card product">
            <img :src="imageUrl(p.image)" :alt="p.title" />
            <p class="muted">{{ p.brand }} • {{ p.partNumber }}</p>
            <h3>{{ p.title }}</h3>
            <p class="muted">{{ p.offers.length }} {{ t('عرض من المحلات') }}</p>
            <div class="row between">
              <span class="price">{{
                money(Math.min(...p.offers.map((o: any) => o.price)))
              }}</span
              ><button @click="openProduct(p)">{{ t('التفاصيل') }}</button>
            </div>
          </article>
        </div>
        <div v-if="pages > 1" class="row section-gap">
          <button
            :disabled="page <= 1"
            @click="
              page--;
              load();
            "
          >
            {{ t('السابق') }}</button
          ><span>{{ page }} / {{ pages }}</span
          ><button
            :disabled="page >= pages"
            @click="
              page++;
              load();
            "
          >
            {{ t('التالي') }}
          </button>
        </div>
      </template>
  </div>
</template>

