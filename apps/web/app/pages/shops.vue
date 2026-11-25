<script setup lang="ts">
const { t } = useI18n();
const { busy, categories, category, fitmentVehicle, go, imageUrl, load, login, money, openProduct, page, pages, search, shopFilter, shops, user, vehicle, vehicles, view, visible, visualCategories } = useMarket();
</script>

<template>
  <div>
      <template v-if="view === 'home' || view === 'shops'">
        <div v-if="view === 'home'" class="hero hero-rich">
          <div class="hero-copy">
            <b>{{ t('من محلات كتير، اختار الأنسب') }}</b>
            <h1>{{ t('كل اللي عربيتك') }}<br />{{ t('محتاجاه') }} <span>{{ t('في مكان واحد') }}</span></h1>
            <p>{{ t('قارن عروض القطع، وشوف المتاح عند محلك.') }}</p>
            <button class="orange" @click="($refs.searchInput as any)?.focus()">
              {{ t('دوّر على قطعتك ←') }}
            </button>
          </div>
          <img src="/assets/hero-cutout.png" :alt="t('مجموعة قطع غيار توضيحية')" />
        </div>
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
        <div v-if="view === 'shops'" class="store-discovery section-gap">
          <div v-for="(s, n) in shops" :key="s.id" class="card store-discovery-card">
            <template v-if="s.photos && s.photos.length">
              <img class="store-cover" :src="imageUrl((s.photos.find((p: any) => p.role === 'COVER') || s.photos[0]).url)" :alt="t('صورة {0}', s.name)" />
              <span v-if="(s.photos.find((p: any) => p.role === 'COVER') || s.photos[0]).demo" class="badge">{{ t('صورة تجريبية') }}</span>
              <div v-if="s.photos.length > 1" class="shop-thumbs"><img v-for="p in s.photos.filter((x: any) => x.url !== (s.photos.find((q: any) => q.role === 'COVER') || s.photos[0]).url)" :key="p.id" :src="imageUrl(p.url)" :alt="t('صورة من ') + s.name" /></div>
            </template>
            <template v-else>
              <img class="store-cover" :src="'/assets/shop-demo-'+((Number(n)%2)+1)+'.png'" :alt="t('تصور لمحل تجريبي، ليست صورة المحل الفعلي')" />
              <span class="badge">{{ t('متجر تجريبي') }}</span>
            </template>
            <h2>{{ s.name }}</h2>
            <p>{{ s.city }}<template v-if="s.district"> • {{ s.district }}</template></p>
            <p v-if="s.description" class="shop-desc">{{ s.description }}</p>
            <p v-if="s.workingHours" class="shop-hours">{{ t('مواعيد العمل:') }} {{ s.workingHours }}</p>
            <button @click="shopFilter = s.id; load(); ($refs.catalogGrid as any)?.scrollIntoView({behavior: 'smooth'});">{{ t('عرض المنتجات') }}</button>
          </div>
        </div>
        <div v-if="view === 'home'" class="visual-categories">
          <button
            v-for="c in visualCategories"
            :key="c.label"
            @click="
              category = c.value;
              page = 1;
              load();
            "
          >
            <img :src="c.image" :alt="c.label" /><strong>{{ c.label }}</strong>
          </button>
        </div>
        <button
          v-if="view === 'home'"
          class="vehicle-banner"
          @click="go(user ? 'profile' : 'login')"
        >
          <img
            class="vehicle-icon-img"
            src="/assets/car-icon.png"
            alt=""
            aria-hidden="true"
          /><span
            ><strong>{{ t('اختار عربيتك') }}</strong
            ><small>{{ t('سجّل بياناتها، وتأكد من التوافق قبل الشراء') }}</small></span
          ><b><i class="chv"></i></b>
        </button>
        <div v-if="view === 'home'" class="campaigns">
          <button
            class="campaign maintenance"
            @click="
              category = t('فلاتر');
              load();
            "
          >
            <div>
              <h2>{{ t('وقت الصيانة؟') }}</h2>
              <p>{{ t('فلاتر وزيوت لعربيتك') }}</p>
              <span>{{ t('شوف الاختيارات ←') }}</span>
            </div>
            <img src="/assets/category-oil.png" :alt="t('زيت توضيحي')" /></button
          ><button
            class="campaign braking"
            @click="
              category = t('فرامل');
              load();
            "
          >
            <div>
              <h2>{{ t('فرامل وأمان') }}</h2>
              <p>{{ t('راجع القطعة المناسبة') }}</p>
              <span>{{ t('شوف الاختيارات ←') }}</span>
            </div>
            <img src="/assets/category-brakes.png" :alt="t('فرامل توضيحية')" />
          </button>
        </div>
        <section v-if="view === 'home'" class="shop-showcase">
          <div class="row between">
            <h2>{{ t('اكتشف المحلات') }}</h2>
            <button class="alt" @click="go('shops')">{{ t('عرض الكل ←') }}</button>
          </div>
          <div class="shop-cards">
            <button
              v-for="(s, n) in shops"
              :key="s.id"
              @click="
                shopFilter = s.id;
                go('shops');load();
              "
            >
              <img
                :src="'/assets/shop-demo-' + ((Number(n) % 2) + 1) + '.png'"
                :alt="t('تصور لمحل قطع غيار، ليس صورة المحل الفعلي')"
              />
              <div>
                <img
                  class="shop-icon-img"
                  src="/assets/shop-icon.png"
                  alt=""
                  aria-hidden="true"
                /><strong>{{ s.name }}</strong
                ><small>{{ s.city }} {{ t('• بيانات وصورة توضيحية') }}</small>
              </div>
            </button>
          </div>
        </section>
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

<style>
.store-discovery-card .store-cover{width:100%;height:auto!important;aspect-ratio:16/9;object-fit:cover;display:block}
.shop-thumbs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:10px 14px 4px}.shop-thumbs img{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:block}
.shop-desc{color:#334a63;font-size:15px;line-height:1.6;margin:6px 14px 4px}.shop-hours{color:#5b6b80;font-size:14px;margin:2px 14px 10px}
@media(min-width:1200px){.store-discovery{grid-template-columns:repeat(auto-fill,minmax(360px,1fr))!important;gap:24px!important}}
</style>
