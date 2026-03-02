# CareWell Installation and Run Manual

## Overview
CareWell is a mobile app for medication adherence and self-care routines. This manual describes how to install and run the app from source (development) and from the Android APK (release).

## Prerequisites (Development)
- Node.js 18+ and npm
- Expo Go installed on an Android device, or Android Studio emulator
- Git (optional if using the provided ZIP)

## Install and Run from Source
1) Open a terminal in the project folder `App`.
2) Install dependencies: `npm install`
3) Start Expo: `npm run android`
4) On your device, open Expo Go and scan the QR code (or let the emulator open automatically).

## Install and Run from APK (Release)
1) Download the APK from the release link (to be added).
2) On Android, enable "Install unknown apps" for your browser or file manager.
3) Open the APK file and complete installation.
4) Launch CareWell from your app list.
5) If Play Protect shows a warning, confirm that you want to install.

## Troubleshooting
- If the app does not start, close it and relaunch.
- If Expo Go cannot connect, ensure your device is on the same network as your computer.
- If notifications do not appear, open Settings and grant notification permissions.
