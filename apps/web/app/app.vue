<script setup lang="ts">
import {startRegistration,startAuthentication} from '@simplewebauthn/browser';
const config = useRuntimeConfig();
const base = config.public.apiBase;
const imageUrl=(path:string)=>path.startsWith('/api/media/')?String(base).replace(/\/api$/,'')+path:path;
const route = useRoute();
const router = useRouter();
const view = computed(() => String(route.query.view || "home"));
const token = ref("");
const user = ref<any>(null);
const busy = ref(false);
let cartRestored=false;
const error = ref("");
const message = ref("");
const products = ref<any[]>([]);
const categories = ref<string[]>([]);
const shops = ref<any[]>([]);
const search = ref("");
const category = ref("");
const shopFilter = ref("");
const detail = ref<any>(null);
const cart = ref<any[]>([]);
watch(cart,()=>{if(cartRestored){try{localStorage.setItem('ghiyar-cart',JSON.stringify(cart.value));}catch{}}},{deep:true});

const addresses = ref<any[]>([]);
const vehicles = ref<any[]>([]);
const orders = ref<any[]>([]);
const dash = ref<any>(null);
const dashboardTab = ref("overview");
const expandedOrder = ref("");
const lastPlacedOrder = ref<any>(null);
const catalogEditor=ref<any>(null);
function editCatalog(p:any){catalogEditor.value=JSON.parse(JSON.stringify(p));}
const fitmentForm=reactive({make:'',model:'',fromYear:2020,toYear:2020,engine:'',verified:false});
async function saveCatalog(){await run(async()=>{const p=catalogEditor.value;await api('/admin/products/'+p.id+'/details','PATCH',{title:p.title,category:p.category,description:p.description});dash.value=await api('/dashboard');message.value='تم حفظ المنتج وإعادته للمراجعة';});}
async function uploadCatalogImage(e:any){const file=e.target.files?.[0];if(!file||!catalogEditor.value)return;await run(async()=>{const form=new FormData();form.append('image',file);const response=await fetch(base+'/admin/products/'+catalogEditor.value.id+'/image',{method:'POST',headers:{Authorization:'Bearer '+token.value},body:form});const data=await response.json();if(!response.ok)throw Error(data.message||'تعذر رفع الصورة');catalogEditor.value.image=data.image;dash.value=await api('/dashboard');message.value='تم حفظ الصورة وإعادة المنتج للمراجعة';});}
async function saveFitment(){await run(async()=>{await api('/admin/products/'+catalogEditor.value.id+'/fitments','POST',fitmentForm);dash.value=await api('/dashboard');catalogEditor.value=dash.value.products.find((p:any)=>p.id===catalogEditor.value.id);message.value='تم حفظ سجل التوافق';});}
async function deleteFitment(id:string){await run(async()=>{await api('/admin/fitments/'+id,'DELETE');dash.value=await api('/dashboard');catalogEditor.value=dash.value.products.find((p:any)=>p.id===catalogEditor.value.id);});}
const favorites=ref<any[]>([]);
const tickets=ref<any[]>([]);
const profileName=ref('');
const supportForm=reactive({subject:'',message:''});
const ticketReplies=reactive<Record<string,any>>({});
function ticketReply(t:any){return ticketReplies[t.id]||(ticketReplies[t.id]={reply:t.reply||'',state:t.state});}
async function loadAccountTools(){await run(async()=>{favorites.value=await api('/favorites');tickets.value=await api('/support-tickets');profileName.value=user.value.name;});}
async function toggleFavorite(p:any){if(!user.value){go('login');return;}await run(async()=>{const old=await api('/favorites');const exists=old.some((f:any)=>f.id===p.id);await api('/favorites/'+p.id,exists?'DELETE':'POST');favorites.value=await api('/favorites');message.value=exists?'تم الحذف من المفضلة':'تم الحفظ في المفضلة';});}
async function saveProfile(){await run(async()=>{user.value=await api('/me','PATCH',{name:profileName.value});message.value='تم حفظ الاسم';});}
async function sendTicket(){await run(async()=>{await api('/support-tickets','POST',supportForm);tickets.value=await api('/support-tickets');supportForm.subject='';supportForm.message='';message.value='تم تسجيل رسالة الدعم داخل النظام';});}
async function replyTicket(t:any){await run(async()=>{await api('/admin/support-tickets/'+t.id,'PATCH',ticketReply(t));tickets.value=await api('/support-tickets');message.value='تم حفظ رد الدعم داخل النظام';});}
const returnForms=reactive<Record<string,any>>({});
const returnDecisions=reactive<Record<string,any>>({});
const refundForms=reactive<Record<string,any>>({});
function returnForm(o:any){return returnForms[o.id]||(returnForms[o.id]={reason:'',items:Object.fromEntries(o.items.map((i:any)=>[i.id,0]))});}
function returnDecision(r:any){return returnDecisions[r.id]||(returnDecisions[r.id]={reason:'',refundAmount:0,goodsReceived:false,restock:false});}
function refundForm(r:any){return refundForms[r.id]||(refundForms[r.id]={reference:'',note:''});}
async function requestReturn(o:any){await run(async()=>{const f=returnForm(o);await api('/orders/'+o.id+'/returns','POST',{reason:f.reason,items:Object.entries(f.items).filter(([id,q])=>Number(q)>0).map(([orderItemId,quantity])=>({orderItemId,quantity:Number(quantity)}))});await personal();message.value='تم إرسال طلب الإرجاع للإدارة للمراجعة، لا يوجد رد أموال تلقائي.';});}
async function decideReturn(r:any,approve:boolean){await run(async()=>{const f=returnDecision(r);await api('/admin/returns/'+r.id+'/decision','POST',approve?{...f,approve}:{approve,reason:f.reason,refundAmount:0,goodsReceived:false,restock:false});dash.value=await api('/dashboard');message.value='تم تسجيل قرار الإرجاع. تسجيل رد النقدية منفصل.';});}
async function recordRefund(r:any){await run(async()=>{await api('/admin/returns/'+r.id+'/refund-evidence','POST',refundForm(r));dash.value=await api('/dashboard');message.value='تم تسجيل إثبات رد النقدية. لم ينفّذ النظام تحويلًا.';});}
const cancellationReasons=reactive<Record<string,string>>({});
const settlementForms=reactive<Record<string,{amount:number;method:string;reference:string;note:string}>>({});
function settlementForm(o:any){return settlementForms[o.id]||(settlementForms[o.id]={amount:0,method:'REMITTANCE',reference:'',note:''});}
function shippingBalance(o:any){return (o.shippingEntries||[]).reduce((n:number,e:any)=>n+e.amount,0);}
async function settleShipping(o:any){await run(async()=>{await api('/admin/orders/'+o.id+'/shipping-settlements','POST',settlementForm(o));dash.value=await api('/dashboard');message.value='تم تسجيل مستند التسوية، بدون إجراء تحويل مالي';});}
const decisionForms=reactive<Record<string,{reason:string;shippingRetained:number}>>({});
async function requestCancellation(o:any){await run(async()=>{await api('/orders/'+o.id+'/cancellation-requests','POST',{reason:cancellationReasons[o.id]||''});await personal();message.value='تم إرسال طلب الإلغاء للإدارة. الحسابات مجمدة لحد القرار.';});}
async function decideCancellation(r:any,approve:boolean){await run(async()=>{const d=decisionForms[r.id]||{reason:'',shippingRetained:0};await api('/admin/cancellation-requests/'+r.id+'/decision','POST',{approve,reason:d.reason,...(approve?{shippingRetained:d.shippingRetained}:{})});dash.value=await api('/dashboard');message.value='تم تسجيل قرار الإدارة في سجل الحسابات';});}
function decisionForm(r:any){return decisionForms[r.id]||(decisionForms[r.id]={reason:'',shippingRetained:0});}
const registerMode = ref(false);
const phoneMode=ref(true);
const passkeys=ref<any[]>([]);
async function loadPasskeys(){await run(async()=>{passkeys.value=await api('/auth/passkeys');});}
async function registerPasskey(){await run(async()=>{const request=await api('/auth/passkeys/register/options','POST');const response=await startRegistration({optionsJSON:request.options});await api('/auth/passkeys/register/verify','POST',{challengeId:request.challengeId,response});passkeys.value=await api('/auth/passkeys');message.value='تم تفعيل مفتاح المرور. وسيلة الفتح يحددها الجهاز: بصمة أو Face ID أو رمز الجهاز.';});}
async function loginPasskey(){await run(async()=>{const request=await api('/auth/passkeys/login/options','POST');const response=await startAuthentication({optionsJSON:request.options});const r=await api('/auth/passkeys/login/verify','POST',{challengeId:request.challengeId,response});token.value=r.token;user.value=r.user;sessionStorage.setItem('ghiyar-token',r.token);await personal();go('home');});}
async function revokePasskey(id:string){await run(async()=>{await api('/auth/passkeys/'+id,'DELETE');passkeys.value=passkeys.value.filter(k=>k.id!==id);message.value='تم إلغاء مفتاح المرور';});}

const phoneAuth=reactive({phone:'',name:'',code:'',challengeId:'',expiresAt:''});
async function startPhone(){await run(async()=>{const r=await api('/auth/phone/start','POST',{phone:phoneAuth.phone,deviceLabel:'متصفح الويب'});phoneAuth.challengeId=r.challengeId;phoneAuth.expiresAt=r.expiresAt;message.value=r.testMode?'اختبار فقط: كود التحقق الثابت 123456. لم يتم إرسال SMS.':'تم طلب كود التحقق. أدخله خلال الوقت الموضح.';});}
async function checkPhone(){await run(async()=>{const r=await api('/auth/phone/check','POST',{challengeId:phoneAuth.challengeId,code:phoneAuth.code,name:phoneAuth.name});token.value=r.token;user.value=r.user;sessionStorage.setItem('ghiyar-token',r.token);phoneAuth.code='';phoneAuth.challengeId='';await personal();go('home');message.value='تم التحقق من الموبايل. تقدر تفعّل مفتاح مرور من حسابك للدخول بقفل الجهاز بدل الكود في المرات الجاية.';});}
const deliveryArea=reactive({city:'',area:'',fee:0,active:true});
async function saveDeliveryArea(){await run(async()=>{await api('/admin/delivery-areas','POST',deliveryArea);dash.value=await api('/dashboard');message.value='تم حفظ منطقة ورسوم التوصيل';});}
const passwords=reactive({currentPassword:'',newPassword:''});
async function changePassword(){await run(async()=>{await api('/auth/password','POST',passwords);passwords.currentPassword='';passwords.newPassword='';token.value='';user.value=null;sessionStorage.removeItem('ghiyar-token');go('login');message.value='تم تغيير كلمة المرور وتسجيل الخروج من كل الأجهزة. سجّل الدخول بالكلمة الجديدة.';});}
const auth = reactive({ name: "", email: "", password: "" });
const address = reactive({ label: "المنزل", city: "", details: "", phone: "" });
const fitmentVehicle=ref("");
const vehicle = reactive({ make: "", model: "", year: 2020, engine: "" });
const selectedAddress = ref("");
const deliveryAreas=ref<any[]>([]);
const selectedDeliveryArea=ref('');
const deliveryQuote=ref<any>(null);
watch([selectedAddress,selectedDeliveryArea,()=>JSON.stringify(cart.value.map(i=>[i.offerId,i.quantity]))],()=>{deliveryQuote.value=null;requestKey='';});
async function reviewDeliveryQuote(){await run(async()=>{deliveryQuote.value=await api('/orders/quote','POST',{items:cart.value.map(i=>({offerId:i.offerId,quantity:Number(i.quantity)})),addressId:selectedAddress.value,deliveryAreaId:selectedDeliveryArea.value});});}
const note = ref("");
const csv = ref("");
const importResult = ref<any>(null);
const importHistory=ref<any[]>([]);

async function loadImportHistory(){await run(async()=>{importHistory.value=await api('/shops/'+importShop.value+'/imports');});}
const importShop = ref("");
watch(importShop,()=>{importResult.value=null;importHistory.value=[];});
const productForm = reactive({
  brand: "",
  partNumber: "",
  title: "",
  category: "",
  description: "",
});
const shopApplication=ref<any>(null);
const joinForm=reactive({name:'',city:'',address:'',phone:'',details:''});
const applicationReasons=reactive<Record<string,string>>({});
async function applyShop(){await run(async()=>{shopApplication.value=await api('/shop-applications','POST',joinForm);message.value='تم إرسال طلب الانضمام، البيع متوقف لحد موافقة الإدارة';});}
async function decideShopApplication(a:any,approve:boolean){await run(async()=>{await api('/admin/shop-applications/'+a.id+'/decision','POST',{approve,reason:applicationReasons[a.id]||''});dash.value=await api('/dashboard');message.value='تم تسجيل قرار طلب الانضمام';});}
const newShop = reactive({ name: "", city: "" });
const offerForm = reactive({ productId: "", sku: "", price: 0, stock: 0 });
const visualCategories = [
  { label: "فرامل", value: "فرامل", image: "/assets/category-brakes.png" },
  { label: "زيوت", value: "زيوت", image: "/assets/category-oil.png" },
  { label: "فلاتر", value: "فلاتر", image: "/assets/category-filter.png" },
  { label: "عفشة", value: "تعليق", image: "/assets/category-suspension.png" },
  { label: "كل الأقسام", value: "", image: "/assets/category-accessory.png" },
];
const page = ref(1);
const pages = ref(1);
let requestKey = "";
const statusLabels: Record<string, string> = {
  PLACED: "تم الطلب",
  ACCEPTED: "مقبول",
  PREPARING: "قيد التجهيز",
  SHIPPED: "في الطريق",
  DELIVERED: "تم التسليم",
  CANCELLED: "ملغي",
};
const next: Record<string, string> = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "SHIPPED",
  SHIPPED: "DELIVERED",
};
const money = (p: number) =>
  new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(
    p / 100,
  );
const total = computed(() =>
  cart.value.reduce((s, i) => s + i.price * i.quantity, 0),
);
const visible = computed(() =>
  products.value
    .map((p) => ({
      ...p,
      offers: p.offers.filter(
        (o: any) => !shopFilter.value || o.shopId === shopFilter.value,
      ),
    }))
    .filter((p) => p.offers.length),
);
async function api(path: string, method = "GET", body?: any) {
  try{return await $fetch<any>(`${base}${path}`,{method:method as any,body,headers:token.value?{Authorization:`Bearer ${token.value}`}:{}});}
  catch(e:any){if(e.status===401&&token.value){token.value='';user.value=null;sessionStorage.removeItem('ghiyar-token');}throw e;}
}
async function run(fn: () => Promise<void>) {
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    await fn();
  } catch (e: any) {
    const m = e.data?.message;
    error.value = Array.isArray(m)
      ? m.join("، ")
      : m || "تعذر الاتصال. تأكد من تشغيل الخادم وحاول مرة أخرى.";
  } finally {
    busy.value = false;
  }
}
function go(v: string) {
  error.value = "";
  message.value = "";
  router.push({ query: { view: v } });
}
async function load() {
  await run(async () => {
    const q = new URLSearchParams({
      search: search.value,
      category: category.value,
      page: String(page.value),
    });
    if(shopFilter.value)q.set('shopId',shopFilter.value);
    const chosen=vehicles.value.find(v=>v.id===fitmentVehicle.value);if(chosen){q.set('make',chosen.make);q.set('model',chosen.model);q.set('year',String(chosen.year));if(chosen.engine)q.set('engine',chosen.engine);}
    const r = await api("/products?" + q);
    products.value = r.items;
    pages.value = r.pages;
    categories.value = await api("/categories");
    shops.value = await api("/shops");
    deliveryAreas.value=await api('/delivery-areas');
  });
}
async function personal() {
  if (!user.value) return;
  addresses.value = await api("/addresses");
  shopApplication.value=await api('/shop-application');
  vehicles.value = await api("/vehicles");
  orders.value = await api("/orders");
  if (!selectedAddress.value)
    selectedAddress.value = addresses.value[0]?.id || "";
}
async function openProduct(p: any) {
  await run(async () => {
    detail.value = await api("/products/" + p.id);
    go("product");
  });
}
function add(p: any, o: any) {
  const found = cart.value.find((i) => i.offerId === o.id);
  if (found) {
    if (found.quantity < o.stock) found.quantity++;
  } else
    cart.value.push({
      offerId: o.id,
      shopId: o.shopId,
      shopName: o.shop?.name || shops.value.find((s: any)=>s.id===o.shopId)?.name || '',
      title: p.title,
      image: p.image,
      partNumber: p.partNumber,
      price: o.price,
      quantity: 1,
      stock: o.stock,
    });
  requestKey = "";
  message.value = "اتضاف للسلة";
}
async function login() {
  await run(async () => {
    const r = await api(
      "/auth/" + (registerMode.value ? "register" : "login"),
      "POST",
      registerMode.value
        ? auth
        : { email: auth.email, password: auth.password },
    );
    token.value = r.token;
    user.value = r.user;
    sessionStorage.setItem("ghiyar-token", r.token);
    auth.password = "";
    await personal();
    if (r.user.role !== "CUSTOMER") await dashboard();
    else go("home");
  });
}
async function logout() {
  await run(async () => {
    await api("/auth/logout", "POST");
  });
  token.value = "";
  user.value = null;
  cart.value = [];
  addresses.value = [];
  orders.value = [];
  sessionStorage.removeItem("ghiyar-token");
  go("home");
}
async function dashboard() {
  await run(async () => {
    dash.value = await api("/dashboard");
    importShop.value = importShop.value || dash.value.shops[0]?.id || "";
    go("dashboard");
  });
}
async function submitOrder() {
  if (!user.value) {
    go("login");
    return;
  }
  await run(async () => {
    if (!requestKey) requestKey = crypto.randomUUID();
    if(!deliveryQuote.value)throw new Error('اختار منطقة التوصيل وراجع التكلفة النهائية أولًا');
    const placed = await api("/checkouts", "POST", {
      items: cart.value.map((i) => ({
        offerId: i.offerId,
        quantity: Number(i.quantity),
      })),
      addressId: selectedAddress.value,
      expectedTotal: deliveryQuote.value.total,
      deliveryAreaId:selectedDeliveryArea.value,
      note: note.value,
      requestKey,
    });
    cart.value = [];
    lastPlacedOrder.value = placed;
    requestKey = "";
    await personal();
    go("orders");
    message.value = "تم تسجيل طلب تجريبي. لا يوجد تحصيل أو توصيل حقيقي.";
  });
}
async function status(id: string, s: string) {
  await run(async () => {
    await api(`/orders/${id}/status`, "PATCH", { status: s });
    if (user.value.role === "CUSTOMER") await personal();
    else dash.value = await api("/dashboard");
  });
}
async function saveAddress() {
  await run(async () => {
    const a = await api("/addresses", "POST", address);
    await personal();
    selectedAddress.value = a.id;
    address.details = "";
    message.value = "تم حفظ العنوان";
  });
}
async function saveVehicle() {
  await run(async () => {
    await api("/vehicles", "POST", { ...vehicle, year: Number(vehicle.year) });
    await personal();
    message.value = "تم حفظ العربية. ده مش تأكيد لتوافق المنتجات.";
  });
}
async function saveOffer(o: any) {
  await run(async () => {
    await api("/offers/" + o.id, "PATCH", {
      price: Number(o.price),
      stock: Number(o.stock),
      active: o.active,
    });
    message.value = "تم تحديث العرض";
  });
}
async function importFile(e: any) {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 2000000) {
      error.value = "حجم الملف أكبر من ٢ ميجابايت";
      return;
    }
    csv.value = await file.text();
    importResult.value = null;
  }
}
async function doImport(commit: boolean) {
  await run(async () => {
    importResult.value = await api(
      "/shops/" + importShop.value + "/import",
      "POST",
      { csv: csv.value, commit,...(commit?{previewId:importResult.value?.previewId}:{}) },
    );
    if (commit) message.value = "تم الاستيراد";
  });
}
async function approve(type: string, id: string, value: boolean) {
  await run(async () => {
    await api(`/admin/${type}/${id}`, "PATCH", { approved: value });
    dash.value = await api("/dashboard");
  });
}
async function createProduct() {
  await run(async () => {
    await api("/products", "POST", productForm);
    message.value = "تم إرسال المنتج لمراجعة الإدارة";
  });
}
async function createShop() {
  await run(async () => {
    await api("/shops", "POST", newShop);
    dash.value = await api("/dashboard");
    message.value = "المتجر بانتظار موافقة الإدارة";
  });
}
async function createOffer() {
  await run(async () => {
    await api("/shops/" + importShop.value + "/offers", "POST", {
      ...offerForm,
      price: Number(offerForm.price),
      stock: Number(offerForm.stock),
    });
    dash.value = await api("/dashboard");
    message.value = "تم حفظ العرض";
  });
}
watch(importShop, () => {
  importResult.value = null;
});
onMounted(async () => {
  try{const saved=JSON.parse(localStorage.getItem('ghiyar-cart')||'[]');if(Array.isArray(saved))cart.value=saved.filter((i:any)=>i&&typeof i.offerId==='string'&&typeof i.shopId==='string'&&typeof i.title==='string'&&typeof i.image==='string'&&/^\/assets\//.test(i.image)&&Number.isSafeInteger(i.price)&&i.price>0&&Number.isSafeInteger(i.quantity)&&i.quantity>0&&i.quantity<=100&&Number.isSafeInteger(i.stock)&&i.stock>=i.quantity).slice(0,50);}catch{}cartRestored=true;
  token.value = sessionStorage.getItem("ghiyar-token") || "";
  if (token.value) {
    try {
      user.value = await api("/me");
      await personal();
    } catch {
      user.value=null;
      token.value = "";
      sessionStorage.removeItem("ghiyar-token");
    }
  }
  await load();
  if (
    view.value === "dashboard" &&
    user.value?.role !== "CUSTOMER" &&
    user.value
  )
    await dashboard();
});
watch(view, async (v) => {
  if (["orders", "profile", "checkout"].includes(v) && user.value) {
    try {
      await personal();
    } catch (e: any) {
      error.value = "تعذر تحديث بيانات الحساب";
    }
  }
});
</script>
<template>
  <div :class="{ 'recovered-home': view === 'home', 'marketplace-shell': view !== 'home' }">
    <ReferenceHome v-if="view === 'home'" :shops="shops" :cart-count="cart.reduce((s, i) => s + i.quantity, 0)" @navigate="go" @search="(q: string) => { search = q; go('shops'); load(); }" @category="(q: string) => { category = q; go('shops'); load(); }" />
    <div v-if="view !== 'home'" class="notice">
      نسخة تطوير • كل المنتجات والأسعار والطلبات للتجربة فقط • الدفع والتوصيل
      غير مفعّلين
    </div>
    <header v-if="view !== 'home'">
      <a href="/" class="brand"><img src="/assets/reference-logo.png" alt="غيار" /></a>
      <div class="top"><strong>{{ ({shops:"المحلات ونتائج البحث",product:"تفاصيل المنتج",cart:"سلة المشتريات",checkout:"إتمام الطلب",orders:"طلباتي",profile:"حسابي",login:"أهلًا بيك",dashboard:"لوحة التحكم"} as Record<string,string>)[view] }}</strong></div>
      <button v-if="user" @click="go('profile')">أهلًا {{ user.name }}</button
      ><button v-else @click="go('login')">دخول / حساب جديد</button
      ><button @click="go('cart')">
        السلة ({{ cart.reduce((s, i) => s + i.quantity, 0) }})
      </button>
    </header>
    <nav v-if="view !== 'home'">
      <button :class="{ on: view === 'home' }" @click="go('home')">
        الرئيسية</button
      ><button @click="go('shops')">المحلات</button
      ><button @click="go('orders')">طلباتي</button
      ><button @click="go('profile')">عربياتي وعناويني</button
      ><button v-if="user && user.role !== 'CUSTOMER'" @click="dashboard">
        {{ user.role === "ADMIN" ? "إدارة المنصة" : "لوحة التاجر" }}</button
      ><button v-if="user" @click="logout">خروج</button>
    </nav>
    <main v-if="view !== 'home'">
      <div v-if="error" class="error" role="alert">{{ error }}</div>
      <div v-if="message" class="success" role="status">{{ message }}</div>
      <p v-if="busy" class="muted" aria-live="polite">جارٍ التحميل...</p>
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
      <template v-else-if="view === 'product' && detail"
        ><button class="alt" @click="go('home')">← رجوع للمنتجات</button>
        <div class="two section-gap product-detail-layout">
          <div class="card product-information">
            <img class="detail-img" :src="imageUrl(detail.image)" :alt="detail.title" /><button class="alt" @click="toggleFavorite(detail)">حفظ / إزالة من المفضلة</button>
            <p class="muted">{{ detail.brand }} • {{ detail.partNumber }}</p>
            <h1>{{ detail.title }}</h1>
            <div class="product-primary-offer" v-if="detail.offers[0]"><p class="price">{{ money(detail.offers[0].price) }}</p><button class="orange" :disabled="!detail.offers[0].stock" @click="add(detail,detail.offers[0])">{{ detail.offers[0].stock?'أضف للسلة':'غير متوفر' }}</button></div>
            <button class="product-shop-link" v-if="detail.offers[0]" @click="shopFilter=detail.offers[0].shopId;go('shops');load()"><img src="/assets/shop-icon.png" alt=""/><span>{{ detail.offers[0].shop.name }}<small>قطع غيار وصيانة</small></span><b>‹</b></button>
            <div class="vehicle-compatibility"><strong>هل القطعة مناسبة لعربيتك؟</strong><small>راجع رقم القطعة والمحرك مع البائع</small><button class="alt" @click="go(user?'profile':'login')">اختار عربيتك</button></div>
            <h3>تفاصيل القطعة</h3><p>{{ detail.description }}</p>
            <div class="alert">
              التوافق غير مؤكد إلا للبيانات المراجعة أدناه. تشابه شكل القطعة لا
              يكفي.
            </div>
            <p v-if="!detail.fitments.length" class="muted">
              لا توجد بيانات توافق مراجعة لهذا المنتج التجريبي.
            </p>
            <p v-for="f in detail.fitments" :key="f.id">
              {{ f.make }} {{ f.model }} {{ f.fromYear }}-{{ f.toYear }} •
              {{ f.engine }}
            </p>
          </div>
          <div>
            <h2>اختار عرض المحل</h2>
            <div
              v-for="o in detail.offers"
              :key="o.id"
              class="card section-gap"
            >
              <h3>{{ o.shop.name }}</h3>
              <p class="muted">{{ o.shop.city }} • متاح {{ o.stock }} قطعة</p>
              <p class="price">{{ money(o.price) }}</p>
              <button
                class="orange"
                :disabled="o.stock < 1"
                @click="add(detail, o)"
              >
                {{ o.stock ? "أضف للسلة" : "غير متوفر" }}
              </button>
            </div>
          </div>
        </div></template
      >
      <template v-else-if="view === 'login'"
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
      <template v-else-if="view === 'cart' || view === 'checkout'"
        ><h1>{{ view === "cart" ? "سلة المشتريات" : "إتمام طلب تجريبي" }}</h1>
        <div v-if="!cart.length" class="empty">
          السلة فاضية. <button @click="go('home')">اختار قطعك</button>
        </div>
        <div v-else class="two">
          <div class="card cart-lines">
            <button class="cart-shop" @click="go('shops')"><img src="/assets/shop-icon.png" alt=""/><span>{{ new Set(cart.map(i=>i.shopId)).size>1 ? 'سلة من '+new Set(cart.map(i=>i.shopId)).size+' محلات' : (cart[0]?.shopName || 'منتجات المحل') }}<small>راجع رقم القطعة والتوافق مع البائع</small></span><b>‹</b></button>
            <div v-for="(i, n) in cart" :key="i.offerId" class="cart-item line">
              <img :src="imageUrl(i.image)" :alt="i.title" />
              <div style="flex: 1">
                <h3>{{ i.title }}</h3>
                <p class="muted">{{ i.shopName }} • {{ i.partNumber }}</p>
                <span class="cart-line-price">{{ money(i.price) }}</span>
              </div>
              <div class="quantity-control"><button class="quantity-minus" :disabled="i.quantity<=1" @click="i.quantity--; requestKey=''" aria-label="تقليل الكمية">−</button><input class="qty" v-model.number="i.quantity" type="number" min="1" :max="Math.min(100,i.stock)" aria-label="الكمية" @change="requestKey=''"/><button :disabled="i.quantity>=Math.min(100,i.stock)" @click="i.quantity++; requestKey=''" aria-label="زيادة الكمية">+</button></div><button
                class="danger"
                @click="
                  cart.splice(n, 1);
                  requestKey = '';
                "
              >
                حذف
              </button>
            </div>
            <template v-if="view === 'checkout'"
              ><h2>عنوان التوصيل</h2>
              <select v-model="selectedAddress">
                <option value="">اختار عنوان</option>
                <option v-for="a in addresses" :key="a.id" :value="a.id">
                  {{ a.label }} • {{ a.city }} • {{ a.details }}
                </option></select
              ><div v-if="deliveryAreas.length" class="delivery-quote-selection"><label>منطقة التوصيل<select v-model="selectedDeliveryArea" aria-label="منطقة التوصيل"><option value="">اختار منطقة التوصيل</option><option v-for="a in deliveryAreas" :key="a.id" :value="a.id">{{ a.city }} • {{ a.area }} • {{ money(a.fee) }}</option></select></label><button class="alt" :disabled="!selectedAddress||!selectedDeliveryArea||busy" @click="reviewDeliveryQuote">راجع التكلفة النهائية</button><p v-if="deliveryQuote">رسوم المنطقة للسلة كلها: {{ money(deliveryQuote.delivery) }} • الإجمالي: {{ money(deliveryQuote.total) }}</p></div><button
                class="alt section-gap"
                @click="go(user ? 'profile' : 'login')"
              >
                {{ user ? "إضافة عنوان" : "سجّل الدخول أولًا" }}</button
              ><label>ملاحظة<textarea v-model="note" maxlength="500" /></label>
              <p class="alert">
                طلب اختبار فقط. لا دفع ولا توصيل فعلي. رسوم التوصيل الموضحة
                افتراضية وليست سياسة بيع.
              </p></template
            >
          </div>
          <aside class="card" style="align-self: start">
            <h2>ملخص الطلب</h2>
            <p class="row between">
              <span>المنتجات</span><b>{{ money(total) }}</b>
            </p>
            <p class="row between">
              <span>{{ deliveryQuote?'رسوم منطقة التوصيل':'توصيل افتراضي للتجربة' }}</span><b>{{ money(deliveryQuote?.delivery ?? 5000) }}</b>
            </p>
            <hr />
            <p class="row between">
              <span>الإجمالي التقديري</span
              ><b class="price">{{ money(deliveryQuote?.total ?? total + 5000) }}</b>
            </p>
            <div v-if="deliveryQuote" class="quote-breakdown"><p v-for="g in deliveryQuote.groups" :key="g.shopId">{{ shops.find(s=>s.id===g.shopId)?.name || 'محل' }}: منتجات {{ money(g.subtotal) }} + حصة الشحن {{ money(g.delivery) }} = {{ money(g.total) }}</p></div><p class="muted">كل محل يوصّل منتجاته ويحصّل حصته الموضحة فقط. مجموع حصص الشحن يساوي رسوم المنطقة مرة واحدة. الخادم يراجع السعر والمخزون عند التأكيد.</p>
            <button
              v-if="view === 'cart'"
              class="orange"
              @click="go(user ? 'checkout' : 'login')"
            >
              كمّل الطلب</button
            ><button
              v-else
              class="orange"
              :disabled="busy || !selectedAddress || !deliveryQuote"
              @click="submitOrder"
            >
              تأكيد الطلب التجريبي
            </button>
          </aside>
        </div></template
      >
      <template v-else-if="view === 'profile'"
        ><div v-if="!user" class="empty">
          <button @click="go('login')">سجّل الدخول</button>
        </div>
        <template v-else
          ><h1>حسابي</h1>
          <section class="card section-gap"><h2>المفضلة والإعدادات والدعم</h2><button class="alt" @click="loadAccountTools">تحميل بيانات الحساب</button><form class="form" @submit.prevent="saveProfile"><label>اسم الحساب<input v-model="profileName" required minlength="2" maxlength="80"/></label><button :disabled="busy">حفظ اسم الحساب</button></form><h3>المفضلة</h3><p v-if="!favorites.length" class="muted">حمّل بيانات الحساب لعرض المفضلة. العناصر غير المعتمدة لا تظهر.</p><div v-for="p in favorites" :key="p.id" class="customer-order-line"><img :src="imageUrl(p.image)" alt=""/><div><strong>{{p.title}}</strong><small>{{p.brand}} • {{p.partNumber}}</small><button class="alt" @click="openProduct(p.id)">تفاصيل المفضلة</button><button class="danger" @click="toggleFavorite(p)">إزالة المفضلة</button></div></div><h3>رسالة للدعم</h3><p class="muted">رسائل داخل النظام فقط، لا بريد أو SMS تلقائي. لا تكتب كلمات سر أو بيانات بطاقات.</p><form class="form" @submit.prevent="sendTicket"><label>عنوان رسالة الدعم<input v-model="supportForm.subject" required minlength="5" maxlength="120"/></label><label>رسالة الدعم<textarea v-model="supportForm.message" required minlength="10" maxlength="2000"/></label><button :disabled="busy">إرسال للدعم</button></form><div v-for="t in tickets" :key="t.id" class="line"><strong>{{t.subject}} • {{t.state}}</strong><p>{{t.message}}</p><p v-if="t.reply">رد الدعم: {{t.reply}}</p></div></section><section class="card form section-gap"><h2>الدخول بقفل الجهاز</h2><p class="muted">مفتاح مرور اختياري. الجهاز يختار البصمة أو Face ID أو رمز القفل. يحتاج HTTPS أو localhost ومتصفحًا مدعومًا.</p><button @click="registerPasskey" :disabled="busy">تفعيل مفتاح مرور</button><button class="alt" @click="loadPasskeys">عرض مفاتيح المرور</button><div v-for="key in passkeys" :key="key.id"><span>{{key.label}}</span><button class="alt" @click="revokePasskey(key.id)">إلغاء مفتاح المرور</button></div></section>
          <section v-if="user.role==='CUSTOMER'" class="card section-gap"><h2>انضم كتاجر</h2><p class="muted">طلب الانضمام تراجعه الإدارة قبل تفعيل البيع. البيانات للتواصل والمراجعة وليست توثيقًا آليًا.</p><div v-if="shopApplication" class="alert">حالة طلبك: {{ shopApplication.state==='PENDING'?'قيد المراجعة':shopApplication.state==='APPROVED'?'تمت الموافقة':'مرفوض' }} • {{ shopApplication.reviewReason }}</div><form v-if="!shopApplication || shopApplication.state==='REJECTED'" class="form" @submit.prevent="applyShop"><label>اسم المحل<input v-model="joinForm.name" required minlength="2" maxlength="100"/></label><label>مدينة المحل<input v-model="joinForm.city" required minlength="2" maxlength="80"/></label><label>عنوان المحل<textarea v-model="joinForm.address" required minlength="8" maxlength="180"/></label><label>هاتف المحل<input v-model="joinForm.phone" required pattern="\+?[0-9]{8,15}" dir="ltr"/></label><label>تفاصيل النشاط<textarea v-model="joinForm.details" required minlength="10" maxlength="180"/></label><button :disabled="busy">إرسال طلب انضمام</button></form></section>
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
      <template v-else-if="view === 'orders'"
        ><section v-if="lastPlacedOrder" class="order-success"><div class="success-ring">✓</div><h1>تم استلام طلبك</h1><strong>طلب تجريبي</strong><p>رقم الطلب: <b dir="ltr">{{ lastPlacedOrder.id.slice(0,8) }}</b></p><div class="alert">لا يوجد دفع ولا توصيل حقيقي. لا تحتاج لدفع أي مبلغ.</div><p>{{ lastPlacedOrder.orders?.length || 1 }} طلب محل • {{ money(lastPlacedOrder.total) }}</p><div class="row"><button class="orange" @click="lastPlacedOrder=null">تابع الطلب</button><button class="alt" @click="lastPlacedOrder=null;go('home')">الرئيسية</button></div></section><h1>طلباتي</h1>
        <div v-if="!user" class="empty">
          <button @click="go('login')">سجّل الدخول لعرض الطلبات</button>
        </div>
        <div v-else-if="!orders.length" class="empty">لسه مفيش طلبات.</div>
        <div v-for="o in orders" :key="o.id" class="card section-gap">
          <div class="row between">
            <h3>طلب #{{ o.id.slice(0, 8) }}</h3>
            <span class="badge">{{ statusLabels[o.status] }}</span>
          </div>
          <p>{{ o.shop.name }} • {{ money(o.total) }}</p>
          <p class="muted">
            {{ new Date(o.createdAt).toLocaleString("ar-EG") }} • طلب تجريبي
          </p>
          <div v-for="i in o.items" :key="i.id" class="customer-order-line"><img v-if="i.offer?.product?.image" :src="imageUrl(i.offer.product.image)" alt=""/><div><strong>{{ i.title }}</strong><small>الكمية: {{ i.quantity }} • {{ i.partNumber }}</small><b>{{ money(i.unitPrice * i.quantity) }}</b></div></div>
          <div class="order-progress"><div v-for="stage in ['PLACED','ACCEPTED','PREPARING','SHIPPED','DELIVERED']" :key="stage" :class="{reached:o.events.some((e:any)=>e.status===stage)}"><i>✓</i><span>{{ statusLabels[stage] }}</span></div></div><p v-if="o.status==='CANCELLED'" class="badge">الطلب ملغي</p><small class="muted">سجل حالة من الخادم، ليس تتبع موقع شحنة.</small>
          <form v-if="o.status==='DELIVERED' && !o.settlementFrozen" class="form section-gap" @submit.prevent="requestReturn(o)"><h3>طلب إرجاع للمراجعة</h3><p class="muted">لا توجد سياسة قبول أو مدة تلقائية محددة في نسخة الاختبار. الإدارة تراجع الطلب قبل أي تعديل أو رد نقدية.</p><label v-for="i in o.items" :key="i.id">كمية إرجاع: {{ i.title }}<input type="number" v-model.number="returnForm(o).items[i.id]" min="0" :max="i.quantity"/></label><label>سبب الإرجاع<textarea v-model="returnForm(o).reason" required minlength="5" maxlength="180"/></label><button class="alt" :disabled="busy">إرسال طلب إرجاع</button></form><div v-for="r in o.returns" :key="r.id" class="alert"><strong>طلب إرجاع: {{ r.state==='PENDING'?'قيد المراجعة':r.state==='APPROVED'?'مقبول':'مرفوض' }}</strong><p>{{ r.reason }} • {{ r.decisionReason }}</p><p v-if="r.state==='APPROVED'">رد نقدية معتمد: {{ money(r.refundAmount) }} • {{ r.refundedAt?'تم تسجيل إثبات الرد':'بانتظار إثبات الرد' }}</p></div>
          <button
            v-if="['PLACED','ACCEPTED','PREPARING'].includes(o.status) && !o.settlementFrozen"
            class="danger section-gap"
            @click="status(o.id, 'CANCELLED')"
          >
            إلغاء الطلب
          </button><div v-if="o.settlementFrozen" class="alert">طلب الإلغاء قيد مراجعة الإدارة. التسوية المالية المتأثرة مجمدة.</div><form v-if="o.status==='SHIPPED' && !o.settlementFrozen" class="section-gap" @submit.prevent="requestCancellation(o)"><label>سبب طلب الإلغاء<textarea v-model="cancellationReasons[o.id]" required minlength="5" maxlength="180"/></label><button class="alt" :disabled="busy">إرسال طلب إلغاء للإدارة</button><p class="muted">بدء التوصيل لا يمكن إلغاؤه مباشرة. لن تتغير المبالغ قبل قرار الإدارة.</p></form><div v-for="r in o.cancellationReviews" :key="r.id" class="review-history"><small>طلب إلغاء: {{ r.reason }}</small><p>{{ r.state==='PENDING'?'قيد المراجعة':r.state==='APPROVED'?'تمت الموافقة':'تم الرفض' }} • {{ r.decisionReason }}</p></div>
        </div></template
      >
      <template v-else-if="view === 'dashboard' && dash"
        ><div class="row between">
          <h1>
            {{ user.role === "ADMIN" ? "لوحة إدارة المنصة" : "لوحة التاجر" }}
          </h1>
          <button @click="dashboard">تحديث البيانات</button>
        </div>
        <div class="dashboard-identity"><img src="/assets/shop-icon.png" alt=""/><div><h2>{{ user.role === 'ADMIN' ? 'إدارة المنصة' : (dash.shops[0]?.name || 'متجرك') }}</h2><p>بيانات التجربة الحالية من قاعدة البيانات</p></div></div>
        <div class="dashboard-tabs"><button v-for="t in [['overview','نظرة عامة'],['orders','الطلبات'],['inventory','المنتجات والمخزون'],['import','استيراد وإضافة'],['settlements','تسويات الشحن'],['returns','الإرجاع ورد النقدية'],...(user.role==='ADMIN'?[['review','مركز المراجعة'],['delivery','مناطق التوصيل'],['applications','انضمام المحلات'],['support','دعم العملاء']]:[])]" :key="t[0]" :class="{active:dashboardTab===t[0]}" @click="dashboardTab=t[0]">{{ t[1] }}</button></div>
        <section v-if="dashboardTab==='support' && user.role==='ADMIN'"><h2>دعم العملاء</h2><button class="alt" @click="loadAccountTools">تحميل رسائل الدعم</button><div v-for="t in tickets" :key="t.id" class="card section-gap"><h3>{{t.subject}}</h3><p>{{t.message}}</p><form class="form" @submit.prevent="replyTicket(t)"><label>رد الدعم<textarea v-model="ticketReply(t).reply" required minlength="5" maxlength="2000"/></label><label>حالة رسالة الدعم<select v-model="ticketReply(t).state"><option value="OPEN">مفتوحة</option><option value="CLOSED">مغلقة</option></select></label><button :disabled="busy">حفظ رد الدعم</button></form></div></section><section v-if="dashboardTab==='applications' && user.role==='ADMIN'"><h2>طلبات انضمام المحلات</h2><p class="muted">راجع بيانات النشاط وتواصل مع مقدم الطلب قبل الموافقة. لا يوجد تحقق آلي من المستندات.</p><div v-for="a in dash.shopApplications" :key="a.id" class="card section-gap"><h3>{{ a.name }} • {{ a.city }}</h3><p>{{ a.address }}</p><p dir="ltr">{{ a.phone }}</p><p>{{ a.details }}</p><span class="badge">{{ a.state }}</span><template v-if="a.state==='PENDING'"><label>سبب قرار الانضمام<textarea v-model="applicationReasons[a.id]" minlength="5" maxlength="180"/></label><div class="row"><button :disabled="busy" @click="decideShopApplication(a,true)">اعتماد وتفعيل المتجر</button><button class="danger" :disabled="busy" @click="decideShopApplication(a,false)">رفض طلب الانضمام</button></div></template><p v-else>{{ a.reviewReason }}</p></div></section>
        <section v-if="dashboardTab==='delivery' && user.role==='ADMIN'" class="card"><h2>مناطق ورسوم التوصيل</h2><p class="muted">رسوم المنطقة مرة واحدة للسلة. كل محل مسؤول عن التوصيل. تفعيل الطلبات الحقيقية لسه متوقف.</p><form class="form" @submit.prevent="saveDeliveryArea"><label>المحافظة / المدينة<input v-model="deliveryArea.city" required minlength="2" maxlength="80"/></label><label>المنطقة<input v-model="deliveryArea.area" required minlength="2" maxlength="120"/></label><label>رسوم المنطقة بالقرش<input v-model.number="deliveryArea.fee" type="number" min="0" max="10000000" required/></label><label><input v-model="deliveryArea.active" type="checkbox"/> متاح للتوصيل</label><button :disabled="busy">حفظ منطقة التوصيل</button></form><div v-for="a in dash.deliveryAreas" :key="a.id" class="line row between"><span>{{ a.city }} • {{ a.area }}</span><b>{{ money(a.fee) }}</b><span>{{ a.active?'نشط':'متوقف' }}</span><button class="alt" @click="Object.assign(deliveryArea,{city:a.city,area:a.area,fee:a.fee,active:a.active})">تعديل</button></div></section>
        <div v-if="dashboardTab === 'overview'" class="metrics dashboard-metrics">
          <div class="card">
            الطلبات (آخر ١٠٠)<b>{{ dash.summary.orders }}</b>
          </div>
          <div class="card">
            العروض<b>{{ dash.summary.offers }}</b>
          </div>
          <div class="card">
            إجمالي المسلّم<b>{{ money(dash.summary.revenue) }}</b>
          </div>
        </div>
        <section v-if="dashboardTab==='returns'"><h2>الإرجاع ورد النقدية</h2><p class="alert">إدارة حالات اختبار، لا قبول تلقائي ولا تحويل أموال. رد النقدية لا يشمل الشحن تلقائيًا. المراجعة ليست سياسة تجارية.</p><template v-for="o in dash.orders" :key="o.id"><div v-for="r in o.returns" :key="r.id" class="card section-gap return-review"><h3>#{{o.id.slice(0,8)}} • {{o.shop.name}}</h3><p>{{r.reason}}</p><p v-for="line in r.items" :key="line.orderItemId">{{o.items.find((i:any)=>i.id===line.orderItemId)?.title}} × {{line.quantity}}</p><span class="badge">{{r.state}}</span><form v-if="user.role==='ADMIN' && r.state==='PENDING'" class="form" @submit.prevent="decideReturn(r,true)"><label>سبب قرار الإرجاع<textarea v-model="returnDecision(r).reason" required minlength="5" maxlength="180"/></label><label>رد النقدية المعتمد بالقرش<input type="number" v-model.number="returnDecision(r).refundAmount" min="0" required/></label><label><input type="checkbox" v-model="returnDecision(r).goodsReceived"/> تم استلام وفحص البضاعة</label><label><input type="checkbox" v-model="returnDecision(r).restock"/> القطع سليمة ويمكن إعادتها للمخزون</label><button :disabled="busy">اعتماد الإرجاع</button><button class="danger" type="button" :disabled="busy" @click="decideReturn(r,false)">رفض الإرجاع</button></form><p v-else>{{r.decisionReason}} • {{money(r.refundAmount)}}</p><form v-if="user.role==='ADMIN' && r.state==='APPROVED' && r.refundAmount>0 && !r.refundedAt" class="form" @submit.prevent="recordRefund(r)"><label>مرجع إثبات رد النقدية<input v-model="refundForm(r).reference" required minlength="8" maxlength="120"/></label><label>تفاصيل رد النقدية<textarea v-model="refundForm(r).note" required minlength="5" maxlength="180"/></label><button :disabled="busy">تسجيل إثبات رد النقدية</button></form><p v-if="r.refundedAt">تم تسجيل الإثبات: {{r.refundReference}} • {{r.refundNote}}</p></div></template></section>
        <section v-if="dashboardTab==='settlements'"><h2>تسويات شحن المنصة</h2><p class="alert">السجل يثبت تحصيل المتجر لحصة الشحن نيابة عن المنصة وتوريدها أو مقاصتها. تسجيل تسوية لا ينفّذ تحويلًا ماليًا. احتفظ بإثبات خارجي لكل مبلغ.</p><div v-for="o in dash.orders.filter((o:any)=>o.shippingEntries?.length)" :key="o.id" class="card section-gap"><h3>{{ o.shop.name }} • #{{ o.id.slice(0,8) }}</h3><p class="price">رصيد مستحق للمنصة: {{ money(shippingBalance(o)) }}</p><p v-if="o.settlementFrozen" class="alert">التسوية مجمدة أثناء مراجعة الإلغاء</p><div v-for="e in o.shippingEntries" :key="e.id" class="line"><strong>{{ e.kind==='COLLECTED_FOR_PLATFORM'?'تحصيل نيابة عن المنصة':e.kind==='REMITTANCE'?'توريد':'مقاصة' }} • {{ money(e.amount) }}</strong><small class="muted">{{ new Date(e.createdAt).toLocaleString('ar-EG') }} • {{ e.reference }} • {{ e.note }}</small></div><form v-if="user.role==='ADMIN' && !o.settlementFrozen && shippingBalance(o)>0" class="form section-gap" @submit.prevent="settleShipping(o)"><label>المبلغ بالقرش<input v-model.number="settlementForm(o).amount" type="number" min="1" :max="shippingBalance(o)" required/></label><label>طريقة التسوية<select v-model="settlementForm(o).method"><option value="REMITTANCE">توريد مثبت</option><option value="OFFSET">مقاصة مثبتة</option></select></label><label>رقم إثبات فريد<input v-model="settlementForm(o).reference" required minlength="8" maxlength="120"/></label><label>تفاصيل الإثبات<textarea v-model="settlementForm(o).note" required minlength="5" maxlength="180"/></label><button :disabled="busy">تسجيل تسوية مثبتة</button></form></div><p v-if="!dash.orders.some((o:any)=>o.shippingEntries?.length)" class="empty">لا توجد حصص شحن محصلة لسه.</p></section>
        <template v-if="dashboardTab === 'overview' || dashboardTab === 'orders'">
        <div class="row between"><h2>{{ dashboardTab === 'overview' ? 'أحدث الطلبات' : 'متابعة الطلبات' }}</h2><button v-if="dashboardTab === 'overview'" class="alt" @click="dashboardTab='orders'">عرض الكل</button></div>
        <div v-if="!dash.orders.length" class="empty">مفيش طلبات لسه.</div>
        <div v-for="o in (dashboardTab === 'overview' ? dash.orders.slice(0,3) : dash.orders)" :key="o.id" class="card section-gap">
          <div class="row between">
            <strong>#{{ o.id.slice(0, 8) }} • {{ o.shop.name }}</strong
            ><span class="badge">{{ statusLabels[o.status] }}</span
            ><b>{{ money(o.total) }}</b>
          </div>
          <div class="merchant-order-preview"><div class="order-parcel"><img :src="imageUrl(o.items[0]?.offer?.product?.image || '/assets/shop-icon.png')" alt=""/></div><div><p v-for="i in o.items" :key="i.id">{{ i.title }} <b>× {{ i.quantity }}</b></p><button class="alt" @click="expandedOrder=expandedOrder===o.id?'':o.id">{{ expandedOrder===o.id?'إخفاء التفاصيل':'تفاصيل الطلب' }}</button></div></div>
          <div v-if="expandedOrder===o.id" class="order-expanded"><h3>عنوان الشحن</h3><p>{{ o.address.city }} • {{ o.address.details }}</p><p dir="ltr">{{ o.address.phone }}</p><h3>حالة الطلب</h3><div class="timeline"><span v-for="e in o.events" :key="e.id" class="done">{{ statusLabels[e.status] }}</span></div><p class="muted">طلب تجريبي. لا دفع ولا شحنة حقيقية.</p></div>
          <p class="muted">
            {{ o.address.city }} • {{ o.address.details }} •
            {{ o.address.phone }}
          </p>
          <div class="order-collection"><p>منتجات: {{ money(o.subtotal) }} • حصة شحن للمنصة: {{ money(o.delivery) }}</p><strong>إجمالي التحصيل عند التسليم: {{ money(o.total) }}</strong><small v-if="o.deliveryStartedAt">بدء التوصيل: {{ new Date(o.deliveryStartedAt).toLocaleString('ar-EG') }}</small></div><div v-if="o.settlementFrozen" class="alert">تسوية مجمدة أثناء مراجعة طلب الإلغاء</div><div v-for="r in o.cancellationReviews?.filter((r:any)=>r.state==='PENDING')" :key="r.id" class="cancellation-review"><h3>طلب إلغاء للمراجعة</h3><p>{{ r.reason }}</p><template v-if="user.role==='ADMIN'"><label>سبب القرار<textarea v-model="decisionForm(r).reason" minlength="5" maxlength="180"/></label><label>شحن محتفظ به بالقرش بعد الإلغاء<input v-model.number="decisionForm(r).shippingRetained" type="number" min="0" :max="o.delivery"/></label><p class="muted">لا يتم تسجيل رد أموال تم فعليًا هنا. قرار الاحتفاظ بالشحن يُسجل، والتحصيل/الرد له إجراء مستقل.</p><div class="row"><button class="danger" :disabled="busy" @click="decideCancellation(r,true)">الموافقة على الإلغاء</button><button class="alt" :disabled="busy" @click="decideCancellation(r,false)">رفض الإلغاء</button></div></template></div>
          <div class="row">
            <button
              v-if="next[o.status]"
              :disabled="busy || o.settlementFrozen"
              @click="status(o.id, next[o.status]!)"
            >
              {{ statusLabels[next[o.status]!] }}</button
            ><button
              v-if="['PLACED', 'ACCEPTED', 'PREPARING'].includes(o.status)"
              class="danger"
              @click="status(o.id, 'CANCELLED')"
            >
              إلغاء وإرجاع المخزون
            </button>
          </div>
        </div>
        </template><template v-if="dashboardTab === 'inventory'"><h2>المتاجر والمخزون</h2>
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
        </template><template v-if="dashboardTab === 'import'">
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
        </template><template v-if="user.role === 'ADMIN' && dashboardTab === 'review'"
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
        ></template
      >
      <div v-else class="empty">
        اختار صفحة من القائمة. <button @click="go('home')">الرئيسية</button>
      </div>
    </main>
    <footer>
      غيار • نسخة تطوير 0.1 • اسم وهوية مبدئية • لا يتم تحصيل أي مبالغ
    </footer>
  </div>
</template>
