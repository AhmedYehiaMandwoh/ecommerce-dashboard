import {Injectable,ServiceUnavailableException,UnauthorizedException,ConflictException,HttpException} from '@nestjs/common';
import {randomBytes} from 'node:crypto';
import {Db} from '../../db';import {digest} from '../../security';import {AuthService} from './auth.service';import {normalizePhone,TwilioPhoneVerify} from './phone-verify';import {Prisma} from '../../generated/prisma/client';
@Injectable()
export class PhoneAuthService {
 constructor(private db:Db,private market:AuthService){}
 private testMode(){return process.env.OTP_MODE==='static-test'&&process.env.NODE_ENV!=='production';}
 private enabled(){if(!this.testMode()&&process.env.SMS_SEND_ENABLED!=='true')throw new ServiceUnavailableException('Phone verification is not enabled');}
 private adapter(){return new TwilioPhoneVerify({accountSid:process.env.TWILIO_ACCOUNT_SID||'',authToken:process.env.TWILIO_AUTH_TOKEN||'',serviceSid:process.env.TWILIO_VERIFY_SERVICE_SID||'',sendsEnabled:process.env.SMS_SEND_ENABLED==='true'});}
 async start(d:{phone:string;deviceLabel:string}){
  this.enabled();
  const phone=normalizePhone(d.phone);const now=new Date();
  const challenge=await this.db.$transaction(async tx=>{
   const recent=await tx.otpChallenge.findMany({where:{phone,createdAt:{gte:new Date(now.getTime()-3600000)}},orderBy:{createdAt:'desc'}});
   if(recent.length>=5||(recent[0]&&now.getTime()-recent[0].createdAt.getTime()<60000))throw new HttpException('Wait before requesting another code',429);
   return tx.otpChallenge.create({data:{phone,deviceLabel:d.deviceLabel,expiresAt:new Date(now.getTime()+600000)}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  try{const started=this.testMode()?{providerSid:'STATIC_TEST_ONLY'}:await this.adapter().start(phone);await this.db.otpChallenge.update({where:{id:challenge.id},data:{state:'PENDING',providerSid:started.providerSid}});return {challengeId:challenge.id,expiresAt:challenge.expiresAt,resendAfterSeconds:60,testMode:this.testMode()};}
  catch(e){await this.db.otpChallenge.update({where:{id:challenge.id},data:{state:'FAILED'}});throw e;}
 }
 async check(d:{challengeId:string;code:string;name:string}){
  this.enabled();
  const challenge=await this.db.otpChallenge.findUnique({where:{id:d.challengeId}});
  if(!challenge||(this.testMode()!==(challenge.providerSid==='STATIC_TEST_ONLY'))||challenge.state!=='PENDING'||challenge.expiresAt<new Date()||challenge.attempts>=5)throw new UnauthorizedException('Code is incorrect or expired');
  const claim=await this.db.otpChallenge.updateMany({where:{id:challenge.id,state:'PENDING',attempts:challenge.attempts},data:{state:'CHECKING',attempts:{increment:1}}});
  if(claim.count!==1)throw new ConflictException('Verification already in progress');
  try{if(this.testMode()){if(d.code!=='123456')throw new UnauthorizedException('Code is incorrect or expired');}else{await this.adapter().check(challenge.phone,d.code);}}catch(e){await this.db.otpChallenge.updateMany({where:{id:challenge.id,state:'CHECKING'},data:{state:challenge.attempts+1>=5?'FAILED':'PENDING'}});throw e;}
  const token=randomBytes(32).toString('hex');const expiresAt=new Date(Date.now()+30*86400000);
  const result=await this.db.$transaction(async tx=>{
   const used=await tx.otpChallenge.updateMany({where:{id:challenge.id,state:'CHECKING'},data:{state:'CONSUMED'}});if(used.count!==1)throw new ConflictException('Verification already used');
   const user=await tx.user.upsert({where:{phone:challenge.phone},create:{phone:challenge.phone,phoneVerifiedAt:new Date(),name:d.name.trim(),role:'CUSTOMER'},update:{phoneVerifiedAt:new Date()}});
   const device=await tx.deviceSession.create({data:{userId:user.id,tokenHash:digest(token),label:challenge.deviceLabel,expiresAt}});
   const session=await this.deviceAccess(tx,user,device.id);return {user,device,session};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return {...result.session,deviceToken:token,deviceId:result.device.id,deviceExpiresAt:expiresAt};
 }
 private async deviceAccess(tx:Prisma.TransactionClient,user:any,deviceId:string){const token=randomBytes(32).toString('hex');const expiresAt=new Date(Date.now()+12*3600000);await tx.session.create({data:{id:digest(token),userId:user.id,expiresAt,deviceId}});return {token,expiresAt,user:{id:user.id,name:user.name,email:user.email,phone:user.phone,role:user.role}};}
 async refresh(token:string){
  const oldHash=digest(token);const replacement=randomBytes(32).toString('hex');
  const device=await this.db.$transaction(async tx=>{
   const old=await tx.deviceSession.findUnique({where:{tokenHash:oldHash},include:{user:true}});
   if(!old||old.revokedAt||old.expiresAt<new Date())throw new UnauthorizedException('Verify this device again');
   const updated=await tx.deviceSession.updateMany({where:{id:old.id,tokenHash:oldHash,revokedAt:null},data:{tokenHash:digest(replacement),lastUsedAt:new Date()}});
   if(updated.count!==1)throw new UnauthorizedException('Device token already rotated');
   await tx.session.deleteMany({where:{deviceId:old.id}});const session=await this.deviceAccess(tx,old.user,old.id);return {...old,session};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return {...device.session,deviceToken:replacement,deviceId:device.id,deviceExpiresAt:device.expiresAt};
 }
 async revoke(user:any,id:string){await this.db.$transaction(async tx=>{const found=await tx.deviceSession.findFirst({where:{id,userId:user.id}});if(!found)throw new UnauthorizedException();await tx.deviceSession.update({where:{id},data:{revokedAt:new Date()}});await tx.session.deleteMany({where:{deviceId:id}});});return {ok:true};}
 list(user:any){return this.db.deviceSession.findMany({where:{userId:user.id},select:{id:true,label:true,createdAt:true,lastUsedAt:true,expiresAt:true,revokedAt:true},orderBy:{createdAt:'desc'}});}
}
