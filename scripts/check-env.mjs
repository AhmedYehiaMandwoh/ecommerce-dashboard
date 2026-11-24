const required=['DATABASE_URL','CORS_ORIGINS'];let bad=false;
for(const k of required){if(!process.env[k]||process.env[k].includes('REPLACE_')){console.error(`Set ${k}`);bad=true;}}
if(process.env.NODE_ENV==='production'&&process.env.TEST_CHECKOUT==='true')console.warn('WARNING: test checkout enabled. This release cannot accept real orders.');
process.exitCode=bad?1:0;

if(process.env.NODE_ENV==='production'&&process.env.OTP_MODE==='static-test'){console.error('Static OTP forbidden in production');process.exitCode=1;}
