import { BadRequestException } from '@nestjs/common';
export type ShopValue={shopId:string;subtotal:number};
/** Minor-unit arithmetic only. Shop order is stable and returned to every caller.
 * Round half up for each group; the final group receives the exact remainder.
 * A share cannot exceed the remaining fee, including very small-fee edge cases.
 */
export function allocateShipping(fee:number,groups:ShopValue[]){
 if(!Number.isSafeInteger(fee)||fee<0||fee>10000000||!groups.length||groups.length>50)throw new BadRequestException('Invalid shipping allocation');
 const sorted=[...groups].sort((a,b)=>a.shopId<b.shopId?-1:a.shopId>b.shopId?1:0);
 if(new Set(sorted.map(g=>g.shopId)).size!==sorted.length||sorted.some(g=>!g.shopId||!Number.isSafeInteger(g.subtotal)||g.subtotal<1))throw new BadRequestException('Invalid shop values');
 const total=sorted.reduce((sum,g)=>sum+BigInt(g.subtotal),0n);
 let remaining=fee;
 return sorted.map((g,index)=>{
  const numerator=BigInt(fee)*BigInt(g.subtotal);
  const rounded=Number((numerator*2n+total)/(total*2n));
  const delivery=index===sorted.length-1?remaining:Math.min(remaining,rounded);
  remaining-=delivery;
  return {...g,delivery,total:g.subtotal+delivery,shippingBeneficiary:'PLATFORM'};
 });
}

/** Policy approved by owner: fixed zone fee before any delivery starts.
 * Shipping/delivered history is never silently recalculated.
 */
export function previewCancellationShipping(fee:number,orders:(ShopValue&{status:string})[]){
 const active=orders.filter(o=>o.status!=='CANCELLED');
 if(!active.length)return {delivery:0,groups:[],requiresManualAdjustment:false};
 if(orders.some(o=>['SHIPPED','DELIVERED'].includes(o.status)))return {delivery:fee,groups:null,requiresManualAdjustment:true};
 return {delivery:fee,groups:allocateShipping(fee,active),requiresManualAdjustment:false};
}
