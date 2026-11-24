import { BadRequestException } from '@nestjs/common';
import { ShopValue } from './shipping';
/** Percent discount on products only, applied per shop (round half up) BEFORE shipping allocation,
 * so shipping shares are proportional to post-discount values (owner rule). Shipping is never discounted.
 * Each shop must keep at least 1 minor unit, which allocateShipping requires. */
export function applyPercent(groups:ShopValue[],percent:number){
 if(!Number.isInteger(percent)||percent<1||percent>50)throw new BadRequestException('Invalid discount');
 return groups.map(g=>{const d=Math.floor((g.subtotal*percent*2+100)/200);const after=Math.max(1,g.subtotal-d);return {shopId:g.shopId,subtotal:after,discount:g.subtotal-after};});
}
export function normalizeCode(c?:string){return (c||'').trim().toUpperCase();}
