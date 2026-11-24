import assert from "node:assert/strict";
import { Db } from "../src/db";
import { hashPassword } from "../src/security";
const base = process.env.TEST_API_URL || "http://127.0.0.1:4000/api";
const password = process.env.DEMO_PASSWORD!;
let count = 0;
const checks: string[] = [];
const ok = (name: string) => {
  count++;
  checks.push(name);
  console.log("PASS", name);
};
async function req(
  path: string,
  method = "GET",
  data?: any,
  token?: string,
  expected = 200,
) {
  const r = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await r.json();
  assert.equal(r.status, expected, JSON.stringify({ path, body }));
  return body;
}
async function main() {
  const db = new Db();
  try {
    const customer = await req(
      "/auth/login",
      "POST",
      { email: "customer@example.test", password },
      undefined,
      201,
    );
    const merchant = await req(
      "/auth/login",
      "POST",
      { email: "merchant@example.test", password },
      undefined,
      201,
    );
    const admin = await req(
      "/auth/login",
      "POST",
      { email: "admin@example.test", password },
      undefined,
      201,
    );
    ok("All three roles sign in");
    const phoneStart=await req('/auth/phone/start','POST',{phone:'+201000000000',deviceLabel:'Test device'},undefined,201);
    assert.equal(phoneStart.testMode,true);
    await req('/auth/phone/start','POST',{phone:'+201000000000',deviceLabel:'Test device'},undefined,429);
    await req('/auth/phone/check','POST',{challengeId:phoneStart.challengeId,code:'999999',name:'Phone user'},undefined,401);
    const phoneLogin=await req('/auth/phone/check','POST',{challengeId:phoneStart.challengeId,code:'123456',name:'Phone user'},undefined,201);
    assert.equal(phoneLogin.user.phone,'+201000000000');assert.equal(phoneLogin.user.role,'CUSTOMER');
    await req('/auth/phone/check','POST',{challengeId:phoneStart.challengeId,code:'123456',name:'Phone user'},undefined,401);
    await req('/auth/devices/'+phoneLogin.deviceId,'DELETE',undefined,phoneLogin.token);
    ok('Static-test OTP wrong code, cooldown, single use, phone customer creation and revocation');
    const capped=await req('/auth/phone/start','POST',{phone:'+201000000099',deviceLabel:'Attempt limit'},undefined,201);for(let attempt=0;attempt<5;attempt++)await req('/auth/phone/check','POST',{challengeId:capped.challengeId,code:'000000',name:'Attempt test'},undefined,401);await req('/auth/phone/check','POST',{challengeId:capped.challengeId,code:'123456',name:'Attempt test'},undefined,401);
    const pk=await req('/auth/passkeys/login/options','POST',{},undefined,201);await req('/auth/passkeys/login/verify','POST',{challengeId:pk.challengeId,response:{id:'forged-id'}},undefined,401);await req('/auth/passkeys/login/verify','POST',{challengeId:pk.challengeId,response:{id:'forged-id'}},undefined,401);
    ok('OTP attempt exhaustion and forged/replayed passkey challenge cannot authenticate');

    const {randomBytes}=await import('node:crypto');const {digest}=await import('../src/security');
    const deviceToken=randomBytes(32).toString('hex');const device=await db.deviceSession.create({data:{userId:customer.user.id,label:'Integration device',tokenHash:digest(deviceToken),expiresAt:new Date(Date.now()+3600000)}});
    const refreshed=await req('/auth/device/refresh','POST',{deviceToken},undefined,201);
    assert(refreshed.deviceToken!==deviceToken);assert.equal(refreshed.user.id,customer.user.id);
    await req('/auth/device/refresh','POST',{deviceToken},undefined,401);
    const safeDevices=await req('/auth/devices','GET',undefined,refreshed.token);assert(!JSON.stringify(safeDevices).includes('tokenHash'));
    await req('/auth/devices/'+device.id,'DELETE',undefined,refreshed.token);
    await req('/me','GET',undefined,refreshed.token,401);
    await req('/auth/device/refresh','POST',{deviceToken:refreshed.deviceToken},undefined,401);
    ok('Device tokens rotate once and revocation invalidates access and refresh');

    const account=await req('/auth/register','POST',{name:'Password test',email:`password-${Date.now()}@example.test`,password},undefined,201);
    const second=await req('/auth/login','POST',{email:account.user.email,password},undefined,201);
    await req('/auth/password','POST',{currentPassword:'incorrect-password',newPassword:password+'-changed'},account.token,401);
    const newPassword=password+'-changed';
    await req('/auth/password','POST',{currentPassword:password,newPassword},account.token,201);
    await req('/me','GET',undefined,account.token,401);await req('/me','GET',undefined,second.token,401);
    await req('/auth/login','POST',{email:account.user.email,password},undefined,401);
    await req('/auth/login','POST',{email:account.user.email,password:newPassword},undefined,201);
    ok('Password change checks current password and revokes every session');
    await req("/dashboard", "GET", undefined, undefined, 401);
    await req("/dashboard", "GET", undefined, customer.token, 403);
    ok("Anonymous and customer cannot access merchant dashboard");
    await req(
      "/auth/register",
      "POST",
      {
        name: "Bad role",
        email: "escalate@example.test",
        password,
        role: "ADMIN",
      },
      undefined,
      400,
    );
    ok("Registration role injection rejected");
    await req(
      "/auth/login",
      "POST",
      { email: "customer@example.test", password: "Wrong.Password.123" },
      undefined,
      401,
    );
    ok("Incorrect password rejected");
    const catalog = await req("/products");
    const p = catalog.items.find((p: any) => p.offers.length);
    const offer = p.offers[0];
    assert(catalog.total >= 6);
    ok("Public catalog exposes approved shop offers");
    const deliveryInput={city:'مدينة تجريبية',area:'وسط المدينة',fee:3700,active:true};
    await req('/admin/delivery-areas','POST',deliveryInput,merchant.token,403);
    await req('/admin/delivery-areas','POST',deliveryInput,customer.token,403);
    const area=await req('/admin/delivery-areas','POST',deliveryInput,admin.token,201);
    assert((await req('/delivery-areas')).some((a:any)=>a.id===area.id));
    ok('Only platform admin sets published area shipping fees');

    const address = await req(
      "/addresses",
      "POST",
      {
        label: "اختبار",
        city: "مدينة تجريبية",
        details: "عنوان اختبار آلي غير حقيقي",
        phone: "00000000000",
      },
      customer.token,
      201,
    );
    const checkout = {
      items: [{ offerId: offer.id, quantity: 1 }],
      addressId: address.id,
      requestKey: "integration-" + Date.now(),
      expectedTotal: offer.price + 5000,
    };
    await req(
      "/orders",
      "POST",
      { ...checkout, items: [{ offerId: offer.id, quantity: 0 }] },
      customer.token,
      400,
    );
    ok("Invalid cart quantity rejected");
    await req(
      "/orders",
      "POST",
      { ...checkout, expectedTotal: 1 },
      customer.token,
      409,
    );
    ok("Stale or altered total rejected and transaction rolls back");
    const areaQuote=await req('/orders/quote','POST',{items:[{offerId:offer.id,quantity:1}],addressId:address.id,deliveryAreaId:area.id},customer.token,201);
    assert.equal(areaQuote.delivery,3700);assert.equal(areaQuote.total,offer.price+3700);
    await req('/orders/quote','POST',{items:[{offerId:offer.id,quantity:1}],addressId:address.id,deliveryAreaId:'missing'},customer.token,400);
    ok('Server quote includes one admin-set area fee and rejects unavailable area');
    const before = await db.offer.findUniqueOrThrow({
      where: { id: offer.id },
    });
    const order = await req("/orders", "POST", checkout, customer.token, 201);
    const retry = await req("/orders", "POST", checkout, customer.token, 201);
    assert.equal(retry.id, order.id);
    assert.equal(
      (await db.offer.findUniqueOrThrow({ where: { id: offer.id } })).stock,
      before.stock - 1,
    );
    ok("Checkout and idempotent retry decrement stock exactly once");
    await req("/orders", "POST", checkout, merchant.token, 403);
    ok("Merchant cannot place customer orders");
    const outsider = await db.user.upsert({
      where: { email: "other@example.test" },
      create: {
        email: "other@example.test",
        name: "Other",
        role: "MERCHANT",
        passwordHash: await hashPassword(password),
      },
      update: { passwordHash: await hashPassword(password) },
    });
    const other = await req(
      "/auth/login",
      "POST",
      { email: outsider.email, password },
      undefined,
      201,
    );
    await req(
      "/orders/" + order.id + "/status",
      "PATCH",
      { status: "ACCEPTED" },
      other.token,
      403,
    );
    await req(
      "/offers/" + offer.id,
      "PATCH",
      { price: 1, stock: 999, active: true },
      other.token,
      403,
    );
    ok("Cross-merchant order and stock writes forbidden");
    const otherOrders = await req("/orders", "GET", undefined, other.token);
    assert(!otherOrders.some((o: any) => o.id === order.id));
    ok("Cross-merchant order data isolated");
    await req(
      "/orders/" + order.id + "/status",
      "PATCH",
      { status: "DELIVERED" },
      merchant.token,
      409,
    );
    ok("Order cannot skip status steps");
    await req(
      "/orders/" + order.id + "/status",
      "PATCH",
      { status: "ACCEPTED" },
      merchant.token,
    );
    await req(
      "/orders/" + order.id + "/status",
      "PATCH",
      { status: "CANCELLED" },
      merchant.token,
    );
    await req(
      "/orders/" + order.id + "/status",
      "PATCH",
      { status: "CANCELLED" },
      merchant.token,
      409,
    );
    assert.equal(
      (await db.offer.findUniqueOrThrow({ where: { id: offer.id } })).stock,
      before.stock,
    );
    ok("Cancellation restores stock once only");
    const csv = `sku,brand,part_number,price_minor,stock\n${offer.sku},${p.brand},${p.partNumber},12300,5`;
    const preview = await req(
      "/shops/demo-shop/import",
      "POST",
      { csv, commit: false },
      merchant.token,
      201,
    );
    assert.equal(preview.invalid, 0);
    assert.equal(
      await db.offer.count({
        where: { shopId: "demo-shop", sku: "IMPORT-TEST" },
      }),
      0,
    );
    ok("CSV preview does not mutate inventory");
    await req('/favorites/'+p.id,'POST',undefined,customer.token,201);await req('/favorites/'+p.id,'POST',undefined,customer.token,201);assert.equal((await req('/favorites','GET',undefined,customer.token)).filter((f:any)=>f.id===p.id).length,1);assert.equal((await req('/favorites','GET',undefined,merchant.token)).length,0);await req('/favorites/'+p.id,'DELETE',undefined,customer.token);
    const ticket=await req('/support-tickets','POST',{subject:'Test support request',message:'Test internal support message only'},customer.token,201);assert(!(await req('/support-tickets','GET',undefined,merchant.token)).some((t:any)=>t.id===ticket.id));await req('/admin/support-tickets/'+ticket.id,'PATCH',{reply:'Internal test reply',state:'CLOSED'},merchant.token,403);await req('/admin/support-tickets/'+ticket.id,'PATCH',{reply:'Internal test reply',state:'CLOSED'},admin.token);assert((await req('/support-tickets','GET',undefined,customer.token)).some((t:any)=>t.id===ticket.id&&t.state==='CLOSED'));await req('/me','PATCH',{name:'عميل تجريبي'},customer.token);
    ok('Favorites are idempotent and private; support tickets isolated with admin-only reply; profile name update');

    await req('/shops/demo-shop/import','POST',{csv:csv+'\n',commit:true,previewId:preview.previewId},merchant.token,409);
    await db.offer.update({where:{id:offer.id},data:{stock:{increment:1}}});
    await req('/shops/demo-shop/import','POST',{csv,commit:true,previewId:preview.previewId},merchant.token,409);
    await db.offer.update({where:{id:offer.id},data:{stock:{decrement:1}}});
    const freshPreview=await req('/shops/demo-shop/import','POST',{csv,commit:false},merchant.token,201);
    await req('/shops/demo-shop/import','POST',{csv,commit:true,previewId:freshPreview.previewId},merchant.token,201);
    const repeatedImport=await req('/shops/demo-shop/import','POST',{csv,commit:true,previewId:freshPreview.previewId},merchant.token,201);assert.equal(repeatedImport.replayed,true);
    assert.equal((await db.offer.findUniqueOrThrow({where:{id:offer.id}})).stock,5);
    await db.offer.update({where:{id:offer.id},data:{price:offer.price,stock:before.stock}});
    assert((await req('/shops/demo-shop/imports','GET',undefined,merchant.token)).some((j:any)=>j.id===freshPreview.previewId&&j.state==='COMMITTED'));
    ok('CSV file/shop/actor preview binding, inventory conflict, atomic commit, replay and history');

    await req(
      "/shops/demo-shop/import",
      "POST",
      {
        csv: "sku,brand,part_number,price_minor,stock\nx,UNKNOWN,NONE,-1,3",
        commit: true,
      },
      merchant.token,
      400,
    );
    ok("Invalid import cannot commit");
    const pending = await req(
      "/products",
      "POST",
      {
        brand: "TEST",
        partNumber: "PENDING-" + Date.now(),
        title: "منتج للمراجعة",
        category: "اختبار",
        description: "اختبار",
      },
      merchant.token,
      201,
    );
    await req("/products/" + pending.id, "GET", undefined, undefined, 404);
    await req(
      "/admin/products/" + pending.id,
      "PATCH",
      { approved: true },
      merchant.token,
      403,
    );
    await req(
      "/admin/products/" + pending.id,
      "PATCH",
      { approved: true },
      admin.token,
    );
    await req("/products/" + pending.id);
    ok("Moderation approval restricted to admin");
    const current = await db.offer.findUniqueOrThrow({
      where: { id: offer.id },
    });
    await db.offer.update({ where: { id: offer.id }, data: { stock: 1 } });
    const checkout2 = { ...checkout, requestKey: "race-a-" + Date.now() };
    const checkout3 = { ...checkout, requestKey: "race-b-" + Date.now() };
    const outcomes = await Promise.all(
      [checkout2, checkout3].map(async (data) => {
        const r = await fetch(base + "/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customer.token}`,
          },
          body: JSON.stringify(data),
        });
        return r.status;
      }),
    );
    assert.equal(outcomes.filter((x) => x === 201).length, 1);
    assert.equal(
      (await db.offer.findUniqueOrThrow({ where: { id: offer.id } })).stock,
      0,
    );
    await db.offer.update({
      where: { id: offer.id },
      data: { stock: current.stock },
    });
    ok("Concurrent checkout cannot oversell last unit");
    const secondShop=await db.shop.create({data:{ownerId:outsider.id,name:'Second test shop',city:'مدينة تجريبية',approved:true}});
    const secondOffer=await db.offer.create({data:{shopId:secondShop.id,productId:p.id,sku:'SECOND-TEST',price:30000,stock:10}});
    const groupedItems=[{offerId:offer.id,quantity:1},{offerId:secondOffer.id,quantity:1}];
    const groupedQuote=await req('/orders/quote','POST',{items:groupedItems,addressId:address.id,deliveryAreaId:area.id},customer.token,201);
    assert.equal(groupedQuote.groups.length,2);assert.equal(groupedQuote.groups.reduce((n:number,g:any)=>n+g.delivery,0),3700);
    const groupData={items:groupedItems,addressId:address.id,deliveryAreaId:area.id,requestKey:'group-'+Date.now(),expectedTotal:groupedQuote.total};
    const grouped=await req('/checkouts','POST',groupData,customer.token,201);
    assert.equal(grouped.orders.length,2);assert.equal(grouped.orders.reduce((n:number,o:any)=>n+o.delivery,0),3700);
    const again=await req('/checkouts','POST',groupData,customer.token,201);assert.equal(again.id,grouped.id);
    await req('/checkouts','POST',{...groupData,note:'changed'},customer.token,409);
    assert.equal(await db.financialAudit.count({where:{checkoutId:grouped.id,action:'CHECKOUT_CREATED'}}),1);
    const isolated=await req('/orders','GET',undefined,other.token);assert.equal(isolated.filter((o:any)=>o.checkoutId===grouped.id).length,1);
    ok('Grouped basket atomically splits orders, charges shipping once, isolates shops and rejects changed idempotent replay');
    const rollbackBefore=await db.offer.findUniqueOrThrow({where:{id:offer.id}});
    await db.offer.update({where:{id:secondOffer.id},data:{stock:0}});
    await req('/checkouts','POST',{...groupData,requestKey:'fail-group-'+Date.now()},customer.token,409);
    assert.equal((await db.offer.findUniqueOrThrow({where:{id:offer.id}})).stock,rollbackBefore.stock);
    ok('Grouped checkout rolls back all stock on a failed shop item');
    const firstChild=grouped.orders.find((o:any)=>o.shopId==='demo-shop');
    const secondChild=grouped.orders.find((o:any)=>o.shopId===secondShop.id);
    await req('/orders/'+secondChild.id+'/status','PATCH',{status:'CANCELLED'},customer.token);
    const changedGroup=await db.checkout.findUniqueOrThrow({where:{id:grouped.id},include:{orders:true}});
    assert.equal(changedGroup.delivery,3700);assert.equal(changedGroup.orders.find(o=>o.id===firstChild.id)!.delivery,3700);assert.equal(changedGroup.orders.find(o=>o.id===secondChild.id)!.total,0);
    await req('/orders/'+firstChild.id+'/status','PATCH',{status:'ACCEPTED'},merchant.token);
    await req('/orders/'+firstChild.id+'/status','PATCH',{status:'PREPARING'},merchant.token);
    await req('/orders/'+firstChild.id+'/status','PATCH',{status:'SHIPPED'},merchant.token);
    const started=await db.order.findUniqueOrThrow({where:{id:firstChild.id}});assert(started.deliveryStartedAt);assert.equal(started.deliveryStartedBy,merchant.user.id);
    await req('/orders/'+firstChild.id+'/status','PATCH',{status:'CANCELLED'},customer.token,403);
    const review=await req('/orders/'+firstChild.id+'/cancellation-requests','POST',{reason:'Please stop delivery'},customer.token,201);
    await req('/orders/'+firstChild.id+'/status','PATCH',{status:'DELIVERED'},merchant.token,409);
    await req('/admin/cancellation-requests/'+review.id+'/decision','POST',{approve:false,reason:'Delivery is still proceeding'},merchant.token,403);
    await req('/admin/cancellation-requests/'+review.id+'/decision','POST',{approve:false,reason:'Delivery is still proceeding'},admin.token,201);
    assert.equal((await db.order.findUniqueOrThrow({where:{id:firstChild.id}})).total,started.total);
    const review2=await req('/orders/'+firstChild.id+'/cancellation-requests','POST',{reason:'Customer cannot receive package'},customer.token,201);
    await req('/admin/cancellation-requests/'+review2.id+'/decision','POST',{approve:true,shippingRetained:1000,reason:'Verified actual incurred delivery cost'},admin.token,201);
    const canceled=await db.order.findUniqueOrThrow({where:{id:firstChild.id}});assert.equal(canceled.status,'CANCELLED');assert.equal(canceled.total,0);assert.equal(canceled.deliveryStartedAt!.getTime(),started.deliveryStartedAt!.getTime());
    await req('/admin/cancellation-requests/'+review2.id+'/decision','POST',{approve:true,shippingRetained:0,reason:'Duplicate approval denied'},admin.token,409);
    assert.equal((await db.checkout.findUniqueOrThrow({where:{id:grouped.id}})).delivery,0);
    ok('Grouped cancellation reallocates before delivery, freezes review, audits decisions and clears shipping when all shops cancel');
    const deliveredGroup=await req('/checkouts','POST',{...groupData,items:[{offerId:offer.id,quantity:1}],expectedTotal:offer.price+3700,requestKey:'deliver-'+Date.now()},customer.token,201);
    const deliveredId=deliveredGroup.orders[0].id;
    for(const state of ['ACCEPTED','PREPARING','SHIPPED','DELIVERED'])await req('/orders/'+deliveredId+'/status','PATCH',{status:state},merchant.token);
    assert.equal((await db.shippingEntry.findMany({where:{orderId:deliveredId}})).reduce((n,e)=>n+e.amount,0),3700);
    const settlement={amount:1500,method:'REMITTANCE',reference:'receipt-'+Date.now(),note:'Verified test receipt only, no money transfer'};
    await req('/admin/orders/'+deliveredId+'/shipping-settlements','POST',settlement,merchant.token,403);
    const settled=await req('/admin/orders/'+deliveredId+'/shipping-settlements','POST',settlement,admin.token,201);
    assert.equal((await req('/admin/orders/'+deliveredId+'/shipping-settlements','POST',settlement,admin.token,201)).id,settled.id);
    await req('/admin/orders/'+deliveredId+'/shipping-settlements','POST',{...settlement,reference:'over-'+Date.now(),amount:3000},admin.token,400);
    await req('/admin/orders/'+deliveredId+'/shipping-settlements','POST',{...settlement,amount:1000},admin.token,409);
    assert.equal((await db.shippingEntry.findMany({where:{orderId:deliveredId}})).reduce((n,e)=>n+e.amount,0),2200);
    ok('Delivered shipping ledger records platform receivable; admin-only settlement prevents overpayment and duplicate receipts');
    const deliveredForReturn=await db.order.findUniqueOrThrow({where:{id:deliveredId},include:{items:true}});const ri=deliveredForReturn.items[0];
    const stockBeforeReturn=(await db.offer.findUniqueOrThrow({where:{id:ri.offerId}})).stock;
    const ret=await req('/orders/'+deliveredId+'/returns','POST',{items:[{orderItemId:ri.id,quantity:1}],reason:'طلب إرجاع تجريبي لقطعة واحدة'},customer.token,201);
    await req('/orders/'+deliveredId+'/returns','POST',{items:[{orderItemId:ri.id,quantity:1}],reason:'طلب مكرر للتجربة'},customer.token,409);
    const returnDecision={approve:true,goodsReceived:true,restock:true,refundAmount:ri.unitPrice,reason:'تم استلام وفحص القطعة التجريبية'};
    await req('/admin/returns/'+ret.id+'/decision','POST',returnDecision,merchant.token,403);
    await req('/admin/returns/'+ret.id+'/decision','POST',{...returnDecision,goodsReceived:false},admin.token,400);
    await req('/admin/returns/'+ret.id+'/decision','POST',returnDecision,admin.token,201);
    assert.equal((await db.offer.findUniqueOrThrow({where:{id:ri.offerId}})).stock,stockBeforeReturn+1);
    await req('/admin/returns/'+ret.id+'/decision','POST',returnDecision,admin.token,409);
    const cashEvidence={reference:'test-refund-'+ret.id,note:'إثبات رد نقدي للاختبار فقط دون تحويل'};
    const refundResult=await req('/admin/returns/'+ret.id+'/refund-evidence','POST',cashEvidence,admin.token,201);assert.equal(refundResult.transferPerformed,false);
    await req('/admin/returns/'+ret.id+'/refund-evidence','POST',cashEvidence,admin.token,409);
    await req('/orders/'+deliveredId+'/returns','POST',{items:[{orderItemId:ri.id,quantity:ri.quantity}],reason:'تجاوز كمية الإرجاع السابقة'},customer.token,400);
    ok('Returns enforce delivered ownership, quantity cap, admin receipt/restock, one decision and one cash refund evidence record');
    const catProduct=await req('/products','POST',{brand:'MEDIA_TEST',partNumber:'IMAGE1',title:'Test catalog media',category:'اختبار',description:'Fictional test only'},admin.token,201);
    await req('/admin/products/'+catProduct.id+'/details','PATCH',{title:'Edited test product',category:'اختبار',description:'Edited'},merchant.token,403);
    await req('/admin/products/'+catProduct.id+'/details','PATCH',{title:'Edited test product',category:'اختبار',description:'Edited'},admin.token);
    await req('/admin/products/'+catProduct.id+'/fitments','POST',{make:'TEST',model:'MODEL',fromYear:2025,toYear:2020,engine:'TEST',verified:false},admin.token,400);
    const fit=await req('/admin/products/'+catProduct.id+'/fitments','POST',{make:'TEST',model:'MODEL',fromYear:2020,toYear:2025,engine:'TEST',verified:false},admin.token,201);
    await req('/admin/fitments/'+fit.id,'DELETE',undefined,admin.token);
    const sharp=(await import('sharp')).default;const bytes=await sharp({create:{width:10,height:10,channels:3,background:'#0757e9'}}).png().toBuffer();
    const form=new FormData();form.append('image',new Blob([bytes],{type:'image/png'}),'test.png');const imageResponse=await fetch(base+'/admin/products/'+catProduct.id+'/image',{method:'POST',headers:{Authorization:'Bearer '+admin.token},body:form});assert.equal(imageResponse.status,201);const updatedImage=await imageResponse.json();assert.equal(updatedImage.approved,false);assert(updatedImage.image.startsWith('/api/media/'));const servedImage=await fetch(base.replace(/\/api$/,'')+updatedImage.image);assert.equal(servedImage.status,200);assert.equal(servedImage.headers.get('content-type'),'image/webp');
    const invalidImage=new FormData();invalidImage.append('image',new Blob(['not an image'],{type:'image/png'}),'bad.png');assert.equal((await fetch(base+'/admin/products/'+catProduct.id+'/image',{method:'POST',headers:{Authorization:'Bearer '+admin.token},body:invalidImage})).status,400);
    ok('Admin catalog details, explicit fitment validation, safe image decode/re-encode and media serving reject malformed files');
    await req('/admin/products/'+catProduct.id,'PATCH',{approved:true},admin.token);
    const unverified=await req('/admin/products/'+catProduct.id+'/fitments','POST',{make:'TESTCAR',model:'MODEL',fromYear:2020,toYear:2025,engine:'ENGINE',verified:false},admin.token,201);
    assert(!(await req('/products?make=TESTCAR&model=MODEL&year=2022&engine=ENGINE')).items.some((x:any)=>x.id===catProduct.id));
    await req('/admin/products/'+catProduct.id+'/fitments','POST',{make:'TESTCAR',model:'MODEL',fromYear:2020,toYear:2025,engine:'ENGINE',verified:true},admin.token,201);
    assert((await req('/products?make=TESTCAR&model=MODEL&year=2022&engine=ENGINE')).items.some((x:any)=>x.id===catProduct.id));assert(!(await req('/products?make=TESTCAR&model=MODEL&year=2026&engine=ENGINE')).items.some((x:any)=>x.id===catProduct.id));
    await req('/admin/products/'+catProduct.id,'PATCH',{approved:false},admin.token);
    ok('Fitment search requires explicit verified make/model/year/engine and excludes out-of-range years');





    const applicant=await req('/auth/register','POST',{name:'Shop applicant',email:'applicant-'+Date.now()+'@example.test',password},undefined,201);
    const application=await req('/shop-applications','POST',{name:'Pending shop',city:'مدينة اختبار',address:'عنوان تجريبي للمحل للمراجعة',phone:'00000000000',details:'نشاط تجريبي لبيع قطع الغيار'},applicant.token,201);
    assert.equal((await req('/me','GET',undefined,applicant.token)).role,'CUSTOMER');assert.equal(await db.shop.count({where:{ownerId:applicant.user.id}}),0);
    await req('/admin/shop-applications/'+application.id+'/decision','POST',{approve:true,reason:'Self approval denied'},applicant.token,403);
    await req('/admin/shop-applications/'+application.id+'/decision','POST',{approve:true,reason:'Verified manually for isolated test only'},admin.token,201);
    assert.equal((await req('/me','GET',undefined,applicant.token)).role,'MERCHANT');assert.equal(await db.shop.count({where:{ownerId:applicant.user.id,approved:true}}),1);
    await req('/admin/shop-applications/'+application.id+'/decision','POST',{approve:true,reason:'Duplicate decision denied'},admin.token,409);
    await db.shop.updateMany({where:{ownerId:applicant.user.id},data:{approved:false}});
    ok('Shop join request cannot sell until admin approval; approval creates one shop and grants merchant role once');
    await req("/auth/logout", "POST", {}, other.token, 201);
    await req("/me", "GET", undefined, other.token, 401);
    ok("Logout revokes session");
    await db.offer.update({where:{id:offer.id},data:{stock:before.stock}});
    await db.offer.update({where:{id:secondOffer.id},data:{active:false}});
    await db.shop.update({where:{id:secondShop.id},data:{approved:false}});
    console.log(JSON.stringify({ passed: count, checks }, null, 2));
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
