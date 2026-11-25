import {startRegistration,startAuthentication} from '@simplewebauthn/browser';

export function useMarket(): any {
  const nuxt: any = useNuxtApp();
  if (nuxt._market) return nuxt._market;
const config = useRuntimeConfig();
const base = config.public.apiBase;
const imageUrl=(path:string)=>path.startsWith('/api/media/')?String(base).replace(/\/api$/,'')+path:path;
const route = useRoute();
const router = useRouter();
const view = computed(() => {
  const p = route.path.replace(/\/+$/, "") || "/";
  if (p === "/") return "home";
  return p.split("/")[1];
});
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
const dashboardTab = computed(() => (route.path.startsWith("/dashboard") ? route.path.replace(/\/+$/, "").split("/")[2] || "overview" : "overview"));
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
watch([selectedAddress,selectedDeliveryArea,()=>JSON.stringify(cart.value.map(i=>[i.offerId,i.quantity]))],()=>{deliveryQuote.value=null;requestKey.value='';});
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
async function suspendShopApplication(a:any,suspend:boolean){await run(async()=>{await api('/admin/shop-applications/'+a.id+'/suspension','POST',{suspend,reason:applicationReasons[a.id]||''});dash.value=await api('/dashboard');message.value=suspend?'تم إيقاف المتجر':'تمت إعادة تفعيل المتجر';});}
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
const requestKey = ref("");
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
  if (v === "home") router.push("/");
  else if (v === "product" && detail.value) router.push("/product/" + detail.value.id);
  else router.push("/" + v);
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
    const [c, sh, da] = await Promise.all([api("/categories"), api("/shops"), api('/delivery-areas')]);
    categories.value = c;
    shops.value = sh;
    deliveryAreas.value = da;
  });
}
async function personal() {
  if (!user.value) return;
  const [a, sa, v, o] = await Promise.all([api("/addresses"), api("/shop-application"), api("/vehicles"), api("/orders")]);
  addresses.value = a;
  shopApplication.value = sa;
  vehicles.value = v;
  orders.value = o;
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
  requestKey.value = "";
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
    if (!requestKey.value) requestKey.value = crypto.randomUUID();
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
      requestKey: requestKey.value,
    });
    cart.value = [];
    lastPlacedOrder.value = placed;
    requestKey.value = "";
    await personal();
    go("orders");
    message.value = "تم تسجيل طلب تجريبي. لا يوجد تحصيل أو توصيل حقيقي.";
  });
}
async function status(id: string, s: string, trackingNumber?: string) {
  await run(async () => {
    await api(`/orders/${id}/status`, "PATCH", { status: s, ...(trackingNumber ? { trackingNumber } : {}) });
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
      if (view.value === "dashboard" && user.value?.role !== "CUSTOMER") void dashboard();
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
  if (["orders", "profile", "checkout"].includes(String(v)) && user.value) {
    try {
      await personal();
    } catch (e: any) {
      error.value = "تعذر تحديث بيانات الحساب";
    }
  }
});
  const market = { add, address, addresses, api, applicationReasons, applyShop, approve, auth, base, busy, cancellationReasons, cart, catalogEditor, categories, category, changePassword, checkPhone, config, createOffer, createProduct, createShop, csv, dash, dashboard, dashboardTab, decideCancellation, decideReturn, decideShopApplication, suspendShopApplication, decisionForm, decisionForms, deleteFitment, deliveryArea, deliveryAreas, deliveryQuote, detail, doImport, editCatalog, error, expandedOrder, favorites, fitmentForm, fitmentVehicle, go, imageUrl, importFile, importHistory, importResult, importShop, joinForm, lastPlacedOrder, load, loadAccountTools, loadImportHistory, loadPasskeys, login, loginPasskey, logout, message, money, newShop, next, note, offerForm, openProduct, orders, page, pages, passkeys, passwords, personal, phoneAuth, phoneMode, productForm, products, profileName, recordRefund, refundForm, refundForms, registerMode, registerPasskey, replyTicket, requestCancellation, requestKey, requestReturn, returnDecision, returnDecisions, returnForm, returnForms, reviewDeliveryQuote, revokePasskey, route, router, run, saveAddress, saveCatalog, saveDeliveryArea, saveFitment, saveOffer, saveProfile, saveVehicle, search, selectedAddress, selectedDeliveryArea, sendTicket, settleShipping, settlementForm, settlementForms, shippingBalance, shopApplication, shopFilter, shops, startPhone, status, statusLabels, submitOrder, supportForm, ticketReplies, ticketReply, tickets, toggleFavorite, token, total, uploadCatalogImage, user, vehicle, vehicles, view, visible, visualCategories };
  nuxt._market = market;
  return market;
}
