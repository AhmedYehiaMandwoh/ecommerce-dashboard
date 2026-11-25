<script setup lang="ts">
const { address, addresses, api, applyShop, busy, changePassword, favorites, go, imageUrl, joinForm, loadAccountTools, loadPasskeys, login, openProduct, passkeys, passwords, personal, profileName, registerPasskey, revokePasskey, run, saveAddress, saveProfile, saveVehicle, sendTicket, shopApplication, supportForm, tickets, toggleFavorite, user, vehicle, vehicles, view } = useMarket();
</script>

<template>
  <div>
      <template v-if="view === 'profile'"
        ><div v-if="!user" class="empty">
          <button @click="go('login')">سجّل الدخول</button>
        </div>
        <template v-else
          ><h1>حسابي</h1>
          <section class="card section-gap"><h2>المفضلة والإعدادات والدعم</h2><button class="alt" @click="loadAccountTools">تحميل بيانات الحساب</button><form class="form" @submit.prevent="saveProfile"><label>اسم الحساب<input v-model="profileName" required minlength="2" maxlength="80"/></label><button :disabled="busy">حفظ اسم الحساب</button></form><h3>المفضلة</h3><p v-if="!favorites.length" class="muted">حمّل بيانات الحساب لعرض المفضلة. العناصر غير المعتمدة لا تظهر.</p><div v-for="p in favorites" :key="p.id" class="customer-order-line"><img :src="imageUrl(p.image)" alt=""/><div><strong>{{p.title}}</strong><small>{{p.brand}} • {{p.partNumber}}</small><button class="alt" @click="openProduct(p.id)">تفاصيل المفضلة</button><button class="danger" @click="toggleFavorite(p)">إزالة المفضلة</button></div></div><h3>رسالة للدعم</h3><p class="muted">رسائل داخل النظام فقط، لا بريد أو SMS تلقائي. لا تكتب كلمات سر أو بيانات بطاقات.</p><form class="form" @submit.prevent="sendTicket"><label>عنوان رسالة الدعم<input v-model="supportForm.subject" required minlength="5" maxlength="120"/></label><label>رسالة الدعم<textarea v-model="supportForm.message" required minlength="10" maxlength="2000"/></label><button :disabled="busy">إرسال للدعم</button></form><div v-for="t in tickets" :key="t.id" class="line"><strong>{{t.subject}} • {{t.state}}</strong><p>{{t.message}}</p><p v-if="t.reply">رد الدعم: {{t.reply}}</p></div></section><section class="card form section-gap"><h2>الدخول بقفل الجهاز</h2><p class="muted">مفتاح مرور اختياري. الجهاز يختار البصمة أو Face ID أو رمز القفل. يحتاج HTTPS أو localhost ومتصفحًا مدعومًا.</p><button @click="registerPasskey" :disabled="busy">تفعيل مفتاح مرور</button><button class="alt" @click="loadPasskeys">عرض مفاتيح المرور</button><div v-for="key in passkeys" :key="key.id"><span>{{key.label}}</span><button class="alt" @click="revokePasskey(key.id)">إلغاء مفتاح المرور</button></div></section>
          <section v-if="user.role==='CUSTOMER'" class="card section-gap"><h2>انضم كتاجر</h2><p class="muted">قدّم طلب لفتح محلك على المنصة: بيانات المحل والتواصل والعنوان وصور ومستندات المحل. الإدارة بتراجع الطلب قبل تفعيل البيع.</p><div v-if="shopApplication" class="alert">حالة طلبك: <b>{{ ({PENDING:'قيد المراجعة',APPROVED:'تمت الموافقة',REJECTED:'مرفوض',SUSPENDED:'موقوف'} as Record<string,string>)[shopApplication.state] || shopApplication.state }}</b></div><button class="orange" @click="go('join-shop')">{{ shopApplication ? 'عرض وتعديل طلب الانضمام' : 'قدّم طلب انضمام كتاجر' }}</button></section>
          <div class="two">
            <div class="card">
              <h2>عناوين التوصيل</h2>
              <p v-for="a in addresses" :key="a.id" class="line">
                {{ a.label }} • {{ a.city }} • {{ a.details }}
                <button
                  class="danger"
                  @click="
                    run(async () => {
                      await api('/addresses/' + a.id, 'DELETE');
                      await personal();
                    })
                  "
                >
                  حذف
                </button>
              </p>
              <form class="form" @submit.prevent="saveAddress">
                <label
                  >اسم العنوان<input v-model="address.label" required /></label
                ><label>المدينة<input v-model="address.city" required /></label
                ><label
                  >العنوان بالتفصيل<textarea
                    v-model="address.details"
                    required
                    minlength="8"
                    maxlength="500"
                  /></label
                ><label
                  >رقم التواصل<input
                    v-model="address.phone"
                    required
                    minlength="8"
                    maxlength="20"
                    dir="ltr" /></label
                ><button :disabled="busy">حفظ العنوان</button>
              </form>
            </div>
            <div class="card">
              <h2>عربياتي</h2>
              <p v-for="v in vehicles" :key="v.id">
                {{ v.make }} {{ v.model }} • {{ v.year }} • {{ v.engine }}
              </p>
              <form class="form" @submit.prevent="saveVehicle">
                <label>الماركة<input v-model="vehicle.make" required /></label
                ><label>الموديل<input v-model="vehicle.model" required /></label
                ><label
                  >سنة الصنع<input
                    v-model.number="vehicle.year"
                    type="number"
                    min="1950"
                    max="2100"
                    required /></label
                ><label
                  >المحرك / الفئة<input
                    v-model="vehicle.engine"
                    required /></label
                ><button :disabled="busy">حفظ العربية</button>
              </form>
              <p class="muted">حفظ العربية لا يثبت توافق أي قطعة معها.</p>
            </div>
          </div><form class="card form section-gap" @submit.prevent="changePassword"><h2>تغيير كلمة المرور</h2><p class="muted">بعد التغيير هتحتاج تدخل من جديد على كل أجهزتك.</p><label>كلمة المرور الحالية<input v-model="passwords.currentPassword" type="password" required minlength="10" maxlength="128" autocomplete="current-password"/></label><label>كلمة المرور الجديدة<input v-model="passwords.newPassword" type="password" required minlength="12" maxlength="128" autocomplete="new-password"/></label><button :disabled="busy">تغيير كلمة المرور</button></form></template
        ></template
      >
  </div>
</template>
