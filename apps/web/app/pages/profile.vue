<script setup lang="ts">
const { t } = useI18n();
const { address, addresses, api, applyShop, busy, changePassword, favorites, go, imageUrl, joinForm, loadAccountTools, loadPasskeys, login, openProduct, passkeys, passwords, personal, profileName, registerPasskey, revokePasskey, run, saveAddress, saveProfile, saveVehicle, sendTicket, shopApplication, supportForm, tickets, toggleFavorite, user, vehicle, vehicles, view } = useMarket();
</script>

<template>
  <div>
      <template v-if="view === 'profile'"
        ><div v-if="!user" class="empty">
          <button @click="go('login')">{{ t('سجّل الدخول') }}</button>
        </div>
        <template v-else
          ><h1>{{ t('حسابي') }}</h1>
          <section class="card section-gap"><h2>{{ t('المفضلة والإعدادات والدعم') }}</h2><button class="alt" @click="loadAccountTools">{{ t('تحميل بيانات الحساب') }}</button><form class="form" @submit.prevent="saveProfile"><label>{{ t('اسم الحساب') }}<input v-model="profileName" required minlength="2" maxlength="80"/></label><button :disabled="busy">{{ t('حفظ اسم الحساب') }}</button></form><h3>{{ t('المفضلة') }}</h3><p v-if="!favorites.length" class="muted">{{ t('حمّل بيانات الحساب لعرض المفضلة. العناصر غير المعتمدة لا تظهر.') }}</p><div v-for="p in favorites" :key="p.id" class="customer-order-line"><img :src="imageUrl(p.image)" alt=""/><div><strong>{{p.title}}</strong><small>{{p.brand}} • {{p.partNumber}}</small><button class="alt" @click="openProduct(p.id)">{{ t('تفاصيل المفضلة') }}</button><button class="danger" @click="toggleFavorite(p)">{{ t('إزالة المفضلة') }}</button></div></div><h3>{{ t('رسالة للدعم') }}</h3><p class="muted">{{ t('رسائل داخل النظام فقط، لا بريد أو SMS تلقائي. لا تكتب كلمات سر أو بيانات بطاقات.') }}</p><form class="form" @submit.prevent="sendTicket"><label>{{ t('عنوان رسالة الدعم') }}<input v-model="supportForm.subject" required minlength="5" maxlength="120"/></label><label>{{ t('رسالة الدعم') }}<textarea v-model="supportForm.message" required minlength="10" maxlength="2000"/></label><button :disabled="busy">{{ t('إرسال للدعم') }}</button></form><div v-for="t in tickets" :key="t.id" class="line"><strong>{{t.subject}} • {{t.state}}</strong><p>{{t.message}}</p><p v-if="t.reply">{{ t('رد الدعم:') }} {{t.reply}}</p></div></section><section class="card form section-gap"><h2>{{ t('الدخول بقفل الجهاز') }}</h2><p class="muted">{{ t('مفتاح مرور اختياري. الجهاز يختار البصمة أو Face ID أو رمز القفل. يحتاج HTTPS أو localhost ومتصفحًا مدعومًا.') }}</p><button @click="registerPasskey" :disabled="busy">{{ t('تفعيل مفتاح مرور') }}</button><button class="alt" @click="loadPasskeys">{{ t('عرض مفاتيح المرور') }}</button><div v-for="key in passkeys" :key="key.id"><span>{{key.label}}</span><button class="alt" @click="revokePasskey(key.id)">{{ t('إلغاء مفتاح المرور') }}</button></div></section>
          <section v-if="user.role==='CUSTOMER'" class="card section-gap"><h2>{{ t('انضم كتاجر') }}</h2><p class="muted">{{ t('قدّم طلب لفتح محلك على المنصة: بيانات المحل والتواصل والعنوان وصور ومستندات المحل. الإدارة بتراجع الطلب قبل تفعيل البيع.') }}</p><div v-if="shopApplication" class="alert">{{ t('حالة طلبك:') }} <b>{{ ({PENDING:t('قيد المراجعة'),APPROVED:t('تمت الموافقة'),REJECTED:t('مرفوض'),SUSPENDED:t('موقوف')} as Record<string,string>)[shopApplication.state] || shopApplication.state }}</b></div><button class="orange" @click="go('join-shop')">{{ shopApplication ? t('عرض وتعديل طلب الانضمام') : t('قدّم طلب انضمام كتاجر') }}</button></section>
          <div class="two">
            <div class="card">
              <h2>{{ t('عناوين التوصيل') }}</h2>
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
                  {{ t('حذف') }}
                </button>
              </p>
              <form class="form" @submit.prevent="saveAddress">
                <label
                  >{{ t('اسم العنوان') }}<input v-model="address.label" required /></label
                ><label>{{ t('المدينة') }}<input v-model="address.city" required /></label
                ><label
                  >{{ t('العنوان بالتفصيل') }}<textarea
                    v-model="address.details"
                    required
                    minlength="8"
                    maxlength="500"
                  /></label
                ><label
                  >{{ t('رقم التواصل') }}<input
                    v-model="address.phone"
                    required
                    minlength="8"
                    maxlength="20"
                    dir="ltr" /></label
                ><button :disabled="busy">{{ t('حفظ العنوان') }}</button>
              </form>
            </div>
            <div class="card">
              <h2>{{ t('عربياتي') }}</h2>
              <p v-for="v in vehicles" :key="v.id">
                {{ v.make }} {{ v.model }} • {{ v.year }} • {{ v.engine }}
              </p>
              <form class="form" @submit.prevent="saveVehicle">
                <label>{{ t('الماركة') }}<input v-model="vehicle.make" required /></label
                ><label>{{ t('الموديل') }}<input v-model="vehicle.model" required /></label
                ><label
                  >{{ t('سنة الصنع') }}<input
                    v-model.number="vehicle.year"
                    type="number"
                    min="1950"
                    max="2100"
                    required /></label
                ><label
                  >{{ t('المحرك / الفئة') }}<input
                    v-model="vehicle.engine"
                    required /></label
                ><button :disabled="busy">{{ t('حفظ العربية') }}</button>
              </form>
              <p class="muted">{{ t('حفظ العربية لا يثبت توافق أي قطعة معها.') }}</p>
            </div>
          </div><form class="card form section-gap" @submit.prevent="changePassword"><h2>{{ t('تغيير كلمة المرور') }}</h2><p class="muted">{{ t('بعد التغيير هتحتاج تدخل من جديد على كل أجهزتك.') }}</p><label>{{ t('كلمة المرور الحالية') }}<input v-model="passwords.currentPassword" type="password" required minlength="10" maxlength="128" autocomplete="current-password"/></label><label>{{ t('كلمة المرور الجديدة') }}<input v-model="passwords.newPassword" type="password" required minlength="12" maxlength="128" autocomplete="new-password"/></label><button :disabled="busy">{{ t('تغيير كلمة المرور') }}</button></form></template
        ></template
      >
  </div>
</template>
