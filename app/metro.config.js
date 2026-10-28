// Lets expo-sqlite's web build load its wasm file (web is only used for quick checks; the app targets phones).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');

module.exports = config;
