# React Native and APK status

**Superseded scope: owner removed APK requirement at14:21 on2026-11-24. Native work is stopped. The instructions below are historical/optional source documentation, not a current blocker for the web-source launch outcome.**

This app uses React Native through Expo, not a web page wrapped in a WebView. Expo prebuild successfully generated an Android project during verification; the generated native directory is intentionally not included, so it can be recreated without shipping development signing material.

## Verified

- Expo dependency compatibility checked.
- TypeScript check passed.
- JavaScript bundles exported for Android, iOS and web.
- React Native Web rendering and customer checkout tested against the same NestJS API.

## Not verified

- No native APK or AAB compiled.
- No native device/emulator installation or runtime check.
- No iOS native build.

The initial environment had JDK 11 and no Android SDK. A follow-up installed JDK 21 and a local SDK/NDK; Gradle reached Expo Kotlin compilation after native C++ compilation but did not complete within bounded low-memory attempts. No APK exists. The generated Gradle/native stack needs a supported current JDK and Android SDK/NDK as specified by Expo/React Native's current build configuration. Do not infer a native build passed from a JavaScript export.

## Development

From the ecommerce-apps repository root, set `.env` for the reachable API/asset host and run `npm start`. Use a compatible Expo Go/development client on your own device. Android emulator can use `10.0.2.2`; a phone must use your computer's LAN address. Server and phone must be on a reachable network. Production uses HTTPS.

## Local standalone preview APK

Install the Android Studio SDK and the JDK supported by the generated Gradle/Android plugin. Set JAVA_HOME and ANDROID_HOME. Set the following environment variables to **your real staging endpoints**, then:

```bash
# EXPO_PUBLIC_API_URL=https://your-api-domain/api
# EXPO_PUBLIC_ASSET_URL=https://your-web-domain
npm run prebuild, then run Gradle assembleRelease in the generated android folder
```

This regenerates native files then runs `:app:assembleRelease`. Expected artifact location, if Gradle succeeds: `android/app/build/outputs/apk/release/app-release.apk`.

The generated release build defaults to a **development signing key**. It is only for private preview. Production requires replacing signing with a private owner-controlled release/upload keystore and protecting it outside source control. Do not publish a development-signed app or treat the package name `com.ghiyar.marketplace.dev` as an approved final application ID.

## Optional cloud build

`eas.json` includes an APK preview profile and AAB production profile. An EAS build requires the owner's Expo account/project setup, credentials and potentially service quotas/charges. No account, cloud build, source upload or paid service was created. Those steps require explicit approval. Avoid choosing this route just to bypass a local build issue without the owner knowing.

Reference checked 2026-11-24: https://docs.expo.dev/build-reference/apk/

## Build-host handoff, 2026-11-24

No native retries remain running. A successful web export is not an APK.

### Recommended no-new-account route

Use an existing owner-controlled Linux/macOS workstation or CI runner with an uninterrupted shell session and outbound access to npm, Google Android repositories and Maven. My planning recommendation is 8 GB RAM minimum headroom, preferably 16 GB, 4 CPU cores and 25 GB free disk for dependencies, SDK/NDK and Gradle caches. These are recommendations for this project, not vendor minimums. The current low-memory host did not finish Kotlin compilation within its bounded runs.

Observed project versions from the installed lock and generated native project:

- Node 22.23.5 was used in verification. Root package engines define supported versions.
- JDK 21 was used for the native attempt.
- Gradle wrapper 9.4.1, Android Gradle Plugin 9.2.1.
- Compile SDK 37, target SDK 36, build-tools 37.0.0.
- NDK 27.1.12297006, CMake 3.22.1 was installed for the attempt.

Regenerate with the committed Expo config and use the generated wrapper, not a globally installed Gradle. Inspect version catalogs after `npm ci` if lockfile dependencies change. Current generic React Native setup documentation describes older SDK/JDK examples and should not override the actual generated configuration for this lockfile.

Run `npm ci`, configure the API/asset endpoints, then `npm run prebuild, then run Gradle assembleRelease in the generated android folder`. Capture the complete build log on the chosen host, allow the first compilation to finish, verify the generated file exists, record its SHA256 and install it on a real test device. Verify startup, sign-in, catalog/search/detail, cart quantities, address selection and a disposable test checkout against TEST_CHECKOUT=true staging. Check images load and repeat after killing/reopening the app. Do not use real customer data or payments.

A standalone preview needs reachable HTTPS API/assets. No staging server is deployed or approved by this source package. For a local emulator/phone workflow, use Expo development mode with the workstation's reachable API/asset address. A phone cannot reach the workstation using 127.0.0.1 or the emulator-only 10.0.2.2 alias. Do not label an APK testable against the API until its endpoint reachability has been verified.

An existing private CI runner is an alternative only after its source destination is approved. Expo cloud remains optional and requires the owner's account/project, explicit source-upload permission and checking current quotas/costs. No cloud build, source upload, new account or purchase was performed.

References checked: https://docs.expo.dev/build-reference/local-builds/ and https://docs.expo.dev/build-reference/apk/ . The latter explains APK direct installation and `adb install`; AAB is not a directly installable preview.
