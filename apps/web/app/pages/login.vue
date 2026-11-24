<script setup lang="ts">
const { auth, busy, checkPhone, login, loginPasskey, phoneAuth, phoneMode, registerMode, startPhone, view } = useMarket();
</script>

<template>
  <div>
      <template v-if="view === 'login'"
        ><section class="auth-choice"><button :class="{alt:!phoneMode}" @click="phoneMode=true">الدخول بالموبايل</button><button :class="{alt:phoneMode}" @click="phoneMode=false">دخول البريد للتطوير والإدارة</button></section><form v-if="phoneMode" class="card form" @submit.prevent="phoneAuth.challengeId?checkPhone():startPhone()"><h1>أهلًا بيك في غيار</h1><button type="button" class="alt" @click="loginPasskey" :disabled="busy">الدخول بمفتاح المرور</button><p class="muted">سجّل برقم موبايلك. في وضع التجربة المحلي استخدم الكود 123456. لا يتم إرسال رسالة حقيقية، ولا تستخدم رقم عميل حقيقي.</p><label>رقم الموبايل بكود الدولة<input v-model="phoneAuth.phone" type="tel" dir="ltr" placeholder="+20..." pattern="\+[1-9][0-9]{7,14}" :disabled="!!phoneAuth.challengeId" required autocomplete="tel"/></label><template v-if="phoneAuth.challengeId"><label>اسمك<input v-model="phoneAuth.name" required minlength="2" maxlength="80" autocomplete="name"/></label><label>كود التحقق<input v-model="phoneAuth.code" required pattern="[0-9]{4,10}" inputmode="numeric" autocomplete="one-time-code"/></label><p class="muted">الكود ينتهي: {{ new Date(phoneAuth.expiresAt).toLocaleTimeString('ar-EG') }}</p></template><button :disabled="busy">{{ phoneAuth.challengeId?'تأكيد رقم الموبايل':'طلب كود التحقق' }}</button><button v-if="phoneAuth.challengeId" type="button" class="alt" @click="phoneAuth.challengeId='';phoneAuth.code=''">تغيير الرقم / إعادة المحاولة</button></form><form v-else class="card form" @submit.prevent="login">
          <h1>{{ registerMode ? "حساب جديد" : "أهلًا بيك من تاني" }}</h1>
          <p class="muted">
            دخول البريد للتطوير والإدارة. دخول الموبايل متاح بوضع الاختبار المحدد في إعدادات الخادم.
          </p>
          <label v-if="registerMode"
            >الاسم<input
              v-model="auth.name"
              required
              minlength="2"
              autocomplete="name" /></label
          ><label
            >البريد الإلكتروني<input
              v-model="auth.email"
              type="email"
              required
              dir="ltr"
              autocomplete="email" /></label
          ><label
            >كلمة المرور<input
              v-model="auth.password"
              type="password"
              required
              minlength="10"
              maxlength="128"
              :autocomplete="
                registerMode ? 'new-password' : 'current-password'
              " /></label
          ><button :disabled="busy">
            {{ registerMode ? "إنشاء الحساب" : "دخول" }}</button
          ><button
            type="button"
            class="alt"
            @click="registerMode = !registerMode"
          >
            {{ registerMode ? "عندك حساب؟ ادخل" : "لسه جديد؟ اعمل حساب" }}
          </button>
        </form></template
      >
  </div>
</template>
