<script setup lang="ts">
const { busy, categories, category, fitmentVehicle, go, imageUrl, load, login, money, openProduct, page, pages, search, shopFilter, shops, user, vehicle, vehicles, view, visible, visualCategories } = useMarket();
</script>

<template>
  <div>
      <template v-if="view === 'home' || view === 'shops'">
        <div v-if="view === 'home'" class="hero hero-rich">
          <div class="hero-copy">
            <b>من محلات كتير، اختار الأنسب</b>
            <h1>كل اللي عربيتك<br />محتاجاه <span>في مكان واحد</span></h1>
            <p>قارن عروض القطع، وشوف المتاح عند محلك.</p>
            <button class="orange" @click="($refs.searchInput as any)?.focus()">
              دوّر على قطعتك ←
            </button>
          </div>
          <img src="/assets/hero-cutout.png" alt="مجموعة قطع غيار توضيحية" />
        </div>
        <div class="search">
          <input
            ref="searchInput"
            v-model="search"
            aria-label="البحث باسم أو رقم القطعة"
            placeholder="بتدور على إيه؟ اسم القطعة، الماركة أو رقمها"
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
            بحث</button
          ><select v-model="shopFilter" aria-label="اختيار المحل" @change="page=1;load()">
            <option value="">كل المحلات</option>
            <option v-for="s in shops" :key="s.id" :value="s.id">
              {{ s.name }}
            </option>
          </select>
        </div>
        <div v-if="view === 'shops'" class="store-discovery section-gap">
          <div v-for="(s, n) in shops" :key="s.id" class="card store-discovery-card"><img class="store-cover" :src="'/assets/shop-demo-'+((n%2)+1)+'.png'" alt="تصور لمحل تجريبي، ليست صورة المحل الفعلي" />
            <span class="badge">متجر تجريبي</span>
            <h2>{{ s.name }}</h2>
            <p>{{ s.city }}</p>
            <button @click="shopFilter = s.id; load(); ($refs.catalogGrid as any)?.scrollIntoView({behavior: 'smooth'});">عرض المنتجات</button>
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
            ><strong>اختار عربيتك</strong
            ><small>سجّل بياناتها، وتأكد من التوافق قبل الشراء</small></span
          ><b>‹</b>
        </button>
        <div v-if="view === 'home'" class="campaigns">
          <button
            class="campaign maintenance"
            @click="
              category = 'فلاتر';
              load();
            "
          >
            <div>
              <h2>وقت الصيانة؟</h2>
              <p>فلاتر وزيوت لعربيتك</p>
              <span>شوف الاختيارات ←</span>
            </div>
            <img src="/assets/category-oil.png" alt="زيت توضيحي" /></button
          ><button
            class="campaign braking"
            @click="
              category = 'فرامل';
              load();
            "
          >
            <div>
              <h2>فرامل وأمان</h2>
              <p>راجع القطعة المناسبة</p>
              <span>شوف الاختيارات ←</span>
            </div>
            <img src="/assets/category-brakes.png" alt="فرامل توضيحية" />
          </button>
        </div>
        <section v-if="view === 'home'" class="shop-showcase">
          <div class="row between">
            <h2>اكتشف المحلات</h2>
            <button class="alt" @click="go('shops')">عرض الكل ←</button>
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
                :src="'/assets/shop-demo-' + ((n % 2) + 1) + '.png'"
                alt="تصور لمحل قطع غيار، ليس صورة المحل الفعلي"
              />
              <div>
                <img
                  class="shop-icon-img"
                  src="/assets/shop-icon.png"
                  alt=""
                  aria-hidden="true"
                /><strong>{{ s.name }}</strong
                ><small>{{ s.city }} • بيانات وصورة توضيحية</small>
              </div>
            </button>
          </div>
        </section>
        <section v-if="user && vehicles.length" class="card section-gap"><label>تصفية حسب توافق معتمد لعربيتي<select v-model="fitmentVehicle" @change="page=1;load()"><option value="">كل المنتجات بدون تأكيد توافق</option><option v-for="v in vehicles" :key="v.id" :value="v.id">{{v.make}} {{v.model}} {{v.year}} {{v.engine}}</option></select></label><p class="muted">النتائج تعتمد فقط على سجلات توافق راجعتها الإدارة. عدم وجود نتيجة لا يعني أن القطعة غير مناسبة. راجع رقم القطعة مع البائع.</p></section>
        <div class="chips">
          <button
            :class="{ on: !category }"
            @click="
              category = '';
              page = 1;
              load();
            "
          >
            كل الأقسام</button
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
          <h2>قطع تختار منها</h2>
          <span class="muted">راجع رقم القطعة والتوافق قبل الشراء الحقيقي</span>
        </div>
        <div v-if="!visible.length && !busy" class="empty">
          مفيش منتجات مطابقة. جرّب بحث تاني.
        </div>
        <div ref="catalogGrid" class="grid catalog-grid">
          <article v-for="p in visible" :key="p.id" class="card product">
            <img :src="imageUrl(p.image)" :alt="p.title" />
            <p class="muted">{{ p.brand }} • {{ p.partNumber }}</p>
            <h3>{{ p.title }}</h3>
            <p class="muted">{{ p.offers.length }} عرض من المحلات</p>
            <div class="row between">
              <span class="price">{{
                money(Math.min(...p.offers.map((o: any) => o.price)))
              }}</span
              ><button @click="openProduct(p)">التفاصيل</button>
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
            السابق</button
          ><span>{{ page }} / {{ pages }}</span
          ><button
            :disabled="page >= pages"
            @click="
              page++;
              load();
            "
          >
            التالي
          </button>
        </div>
      </template>
  </div>
</template>
