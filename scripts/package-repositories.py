"""Create independent source trees for review, without publishing or copying secrets."""
from pathlib import Path
import shutil,json,argparse
p=argparse.ArgumentParser();p.add_argument('--out',required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[1];out=Path(a.out).resolve()
if out==root or root in out.parents:raise SystemExit('Output must be outside source')
excluded={'node_modules','.git','.nuxt','.output','dist','generated','.expo','.gradle','.cxx','build','media','local.properties'}
def copy(src,dst):
 for f in src.rglob('*'):
  rel=f.relative_to(src)
  if not f.is_file() or any(x in excluded for x in rel.parts):continue
  if f.name.startswith('.env') and f.name!='.env.example':continue
  if f.suffix in {'.pem','.jks','.keystore','.log'}:continue
  target=dst/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,target)
def put(path,text):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(text)
dash=out/'ecommerce-dashboard';mobile=out/'ecommerce-apps'
if dash.exists() or mobile.exists():raise SystemExit('Output already exists, choose a fresh review directory')
for app in ['api','web']:copy(root/'apps'/app,dash/'apps'/app)
for f in ['README.md','.gitignore','.dockerignore','.env.example','compose.yaml','Dockerfile.api','Dockerfile.web']:
 put(dash/f,(root/f).read_text())
copy(root/'docs',dash/'docs')
copy(root/'scripts',dash/'scripts')

manifest=json.loads((root/'package.json').read_text());manifest['name']='ghiyar-dashboard';manifest['workspaces']=['apps/api','apps/web'];manifest['scripts'].pop('dev:mobile',None)
put(dash/'package.json',json.dumps(manifest,indent=2)+'\n')
for f in ['Dockerfile.api','Dockerfile.web']:
 text=(dash/f).read_text().replace('COPY apps/mobile/package.json apps/mobile/package.json\n','');put(dash/f,text)
put(dash/'README-REPOSITORY.md','''# Dashboard repository\n\nThis independent workspace contains Nuxt customer/merchant/admin plus NestJS/Prisma/MySQL. Run npm ci, then follow docs/SETUP.md. React Native is supplied separately in ecommerce-apps. The shared project docs describe both clients; mobile commands apply in the app repository, not this workspace. Non-live static-test OTP only, no real SMS or deployment included.\n''')
copy(root/'apps/mobile',mobile)
# Native generated directory is deliberately omitted: app config/plugins are authoritative.
shutil.rmtree(mobile/'android',ignore_errors=True);shutil.rmtree(mobile/'ios',ignore_errors=True)
mobile_manifest=json.loads((mobile/'package.json').read_text());mobile_manifest['name']='ghiyar-customer-app';put(mobile/'package.json',json.dumps(mobile_manifest,indent=2)+'\n')
put(mobile/'.gitignore',(root/'.gitignore').read_text())
put(mobile/'README.md','''# Ghiyar customer app\n\nIndependent React Native/Expo customer source. No APK requested or supplied.\n\n1. npm ci\n2. cp .env.example .env\n3. Set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_ASSET_URL to the running dashboard repository API/web. Use reachable LAN endpoints for a physical device, not localhost. No secrets belong in public variables.\n4. npm run check\n5. npm run web or npm start\n\nThe dashboard repository contains NestJS/MySQL migrations, local database setup, server configuration and test seed. Phone static-test code is123456 only when enabled on the development API. Never use real customer data. Twilio is blank/disabled.\n\nNative biometric/passcode-protected session storage is opt-in and requires a real development build and physical-device acceptance. Expo Go does not prove FaceID support. Native project files are generated from app.json/plugins with npx expo prebuild when needed. No production signing credentials are included.\n''')
print(json.dumps({'dashboard':str(dash),'mobile':str(mobile)}))
