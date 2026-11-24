import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
export type VerifyConfig={accountSid:string;authToken:string;serviceSid:string;sendsEnabled:boolean};
export function normalizePhone(phone:string){
 const value=phone.trim().replace(/[\s()-]/g,'');
 if(!/^\+[1-9][0-9]{7,14}$/.test(value))throw new BadRequestException('Use a phone number with country code, for example +20...');
 return value;
}
/** Transport adapter only. Public routes must add persisted challenge/cooldown limits.
 * No provider message/error body is logged or exposed to callers.
 */
export class TwilioPhoneVerify {
 constructor(private config:VerifyConfig,private transport:typeof fetch=fetch){}
 private validate(){const c=this.config;if(!/^AC[0-9a-f]{32}$/i.test(c.accountSid)||!/^VA[0-9a-f]{32}$/i.test(c.serviceSid)||!c.authToken)throw new ServiceUnavailableException('Phone verification is not configured');}
 private async call(path:string,fields:Record<string,string>){
  this.validate();
  let response:Response;
  try{response=await this.transport(`https://verify.twilio.com/v2/Services/${this.config.serviceSid}/${path}`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(this.config.accountSid+':'+this.config.authToken).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields),signal:AbortSignal.timeout(10000)});}catch{throw new ServiceUnavailableException('Phone verification is temporarily unavailable');}
  if(!response.ok)throw new ServiceUnavailableException('Phone verification could not be completed');
  try{return await response.json();}catch{throw new ServiceUnavailableException('Phone verification is temporarily unavailable');}
 }
 async start(phone:string){
  const to=normalizePhone(phone);
  if(!this.config.sendsEnabled)throw new ServiceUnavailableException('SMS sending is disabled');
  const result=await this.call('Verifications',{To:to,Channel:'sms'});
  if(result.status!=='pending'||!/^VE[0-9a-f]{32}$/i.test(result.sid||''))throw new ServiceUnavailableException('Verification request was not accepted');
  return {providerSid:result.sid,status:'pending'};
 }
 async check(phone:string,code:string){
  if(!this.config.sendsEnabled)throw new ServiceUnavailableException('SMS verification is disabled');
  const to=normalizePhone(phone);
  if(!/^[0-9]{4,10}$/.test(code))throw new BadRequestException('Invalid verification code format');
  const result=await this.call('VerificationCheck',{To:to,Code:code});
  if(result.status!=='approved'||result.valid!==true)throw new UnauthorizedException('Code is incorrect or expired');
  return {approved:true};
 }
}
