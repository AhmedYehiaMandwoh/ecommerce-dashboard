#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../apps/mobile"
: "${EXPO_PUBLIC_API_URL:?Set a reachable HTTPS API URL}"
: "${EXPO_PUBLIC_ASSET_URL:?Set a reachable HTTPS asset URL}"
if [[ "$EXPO_PUBLIC_API_URL" != https://* || "$EXPO_PUBLIC_ASSET_URL" != https://* ]]; then
  echo 'Standalone APK builds require HTTPS URLs. Use Expo development mode for LAN HTTP testing.' >&2
  exit 1
fi
command -v java
java -version
command -v node
node --version
# Resource checks are warnings, not fabricated vendor minimums.
if command -v free >/dev/null 2>&1; then
  free -h
  memory_kb=$(awk '/MemTotal:/ {print $2}' /proc/meminfo)
  if [ "$memory_kb" -lt 8000000 ]; then
    printf '%s\n' 'Warning: less than 8GB RAM. This project did not finish on a low-memory build host.' >&2
  fi
fi
df -h .
if [[ -z "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" ]]; then
  echo 'Set ANDROID_HOME to your Android SDK installation.' >&2
  exit 1
fi
# Generate native files from the checked-in Expo config, without uploading source.
npx expo prebuild --platform android --no-install
cd android
# Preview APK only: generated release signing uses the development key.
# Do not publish this APK to a store. See docs/ANDROID.md for production signing.
# Override for a device-specific preview, e.g. REACT_NATIVE_ARCHITECTURES=arm64-v8a.
# Leave unset to retain all generated target ABIs.
if [ -n "${REACT_NATIVE_ARCHITECTURES:-}" ]; then
  ./gradlew :app:assembleRelease "-PreactNativeArchitectures=$REACT_NATIVE_ARCHITECTURES"
else
  ./gradlew :app:assembleRelease
fi
printf '\nPreview APK: apps/mobile/android/app/build/outputs/apk/release/app-release.apk\n'
