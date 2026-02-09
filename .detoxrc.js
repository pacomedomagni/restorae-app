/**
 * Detox E2E Configuration
 * 
 * This configuration file sets up Detox for end-to-end testing
 * of the Restorae mobile app.
 */
/** @type {Detox.DetoxConfig} */
module.exports = {
  logger: {
    level: process.env.CI ? 'debug' : 'info',
  },
  testRunner: {
    $0: 'jest',
    args: {
      config: 'e2e/jest.config.js',
      _: ['e2e'],
    },
  },
  artifacts: {
    rootDir: '.artifacts',
    plugins: {
      log: 'failing',
      screenshot: 'failing',
      video: 'failing',
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      build: 'xcodebuild -workspace ios/Restorae.xcworkspace -scheme Restorae -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Restorae.app',
    },
    'ios.release': {
      type: 'ios.app',
      build: 'xcodebuild -workspace ios/Restorae.xcworkspace -scheme Restorae -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Restorae.app',
    },
    'android.debug': {
      type: 'android.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
    },
    'android.release': {
      type: 'android.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6_API_33',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
