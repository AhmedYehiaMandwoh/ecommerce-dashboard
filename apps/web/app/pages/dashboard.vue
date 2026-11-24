<script setup lang="ts">
const { api, applicationReasons, approve, busy, catalogEditor, createOffer, createProduct, createShop, csv, dash, dashboard, dashboardTab, decideCancellation, decideReturn, decideShopApplication, decisionForm, deleteFitment, deliveryArea, doImport, editCatalog, expandedOrder, fitmentForm, imageUrl, importFile, importHistory, importResult, importShop, loadAccountTools, loadImportHistory, money, newShop, next, offerForm, orders, productForm, products, recordRefund, refundForm, replyTicket, returnDecision, run, saveCatalog, saveDeliveryArea, saveFitment, saveOffer, settleShipping, settlementForm, shippingBalance, shops, status, statusLabels, ticketReply, tickets, uploadCatalogImage, user, view } = useMarket();
</script>

<template>
  <div>
      <template v-if="view === 'dashboard' && dash"
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
  </div>
</template>
