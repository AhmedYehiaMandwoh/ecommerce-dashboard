<script setup lang="ts">
const { t } = useI18n();
// Upload, preview, set-cover and delete shop photos. `scope` selects the API: the pending application or the approved shop.
const props = defineProps<{ scope: "application" | "shop"; photos: any[]; disabled?: boolean }>();
const emit = defineEmits<{ changed: [] }>();
const { base, token, imageUrl, run } = useMarket();
const prefix = computed(() => (props.scope === "application" ? "/shop-application/photos" : "/merchant/shop/photos"));
const err = ref("");
const uploading = ref(false);
const cover = computed(() => props.photos.find((p) => p.role === "COVER") || props.photos[0]);
async function upload(e: any, role: "COVER" | "GALLERY") {
  const file = e.target.files?.[0]; e.target.value = ""; err.value = "";
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { err.value = t('الصيغ المسموحة JPEG أو PNG أو WebP'); return; }
  if (file.size > 5 * 1024 * 1024) { err.value = t('حجم الصورة أقل من 5 ميجا'); return; }
  uploading.value = true;
  try {
    const form = new FormData(); form.append("role", role); form.append("image", file);
    const res = await fetch(base + prefix.value, { method: "POST", headers: { Authorization: "Bearer " + token.value }, body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || t('تعذر رفع الصورة'));
    emit("changed");
  } catch (x: any) { err.value = x.message; } finally { uploading.value = false; }
}
async function remove(p: any) { await run(async () => { await $fetch(base + prefix.value + "/" + p.id, { method: "DELETE", headers: { Authorization: "Bearer " + token.value } }); emit("changed"); }); }
</script>

<template>
  <div class="spm">
    <p class="spm-note">{{ t('الصور تظهر للعملاء في صفحة المحل. لا ترفع هنا أي مستندات أو بيانات خاصة. JPEG أو PNG أو WebP، حتى 5 ميجا للصورة، وحتى 6 صور.') }}</p>
    <div class="spm-grid">
      <figure v-for="p in photos" :key="p.id" class="spm-item">
        <img :src="imageUrl(p.url)" :alt="p.role === 'COVER' ? t('صورة الغلاف') : t('صورة من المحل')" />
        <span v-if="p.role === 'COVER'" class="spm-tag">{{ t('غلاف') }}</span>
        <span v-if="p.demo" class="spm-demo">{{ t('صورة تجريبية') }}</span>
        <button type="button" class="spm-del" :disabled="disabled" @click="remove(p)">{{ t('حذف') }}</button>
      </figure>
      <p v-if="!photos.length" class="spm-empty">{{ t('لا توجد صور بعد.') }}</p>
    </div>
    <div class="spm-actions">
      <label class="spm-btn">{{ cover ? t('تغيير صورة الغلاف') : t('رفع صورة الغلاف') }}<input type="file" accept="image/jpeg,image/png,image/webp" :disabled="disabled || uploading" @change="upload($event, 'COVER')" /></label>
      <label class="spm-btn alt">{{ t('إضافة صورة للمعرض') }}<input type="file" accept="image/jpeg,image/png,image/webp" :disabled="disabled || uploading || photos.length >= 6" @change="upload($event, 'GALLERY')" /></label>
      <span v-if="uploading" class="spm-note">{{ t('جاري الرفع...') }}</span>
    </div>
    <p v-if="err" class="spm-err" role="alert">{{ err }}</p>
  </div>
</template>

