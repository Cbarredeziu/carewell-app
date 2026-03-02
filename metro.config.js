const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure Metro watches nested Expo CLI deps inside Expo's node_modules.
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, 'node_modules', 'expo', 'node_modules')
];

module.exports = config;
