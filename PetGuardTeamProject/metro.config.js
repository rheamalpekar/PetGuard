const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle react-native-maps on web
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // When bundling for web, redirect react-native-maps to our mock
    if (platform === 'web' && moduleName === 'react-native-maps') {
      return {
        filePath: path.resolve(__dirname, 'mock/react-native-maps-mock.js'),
        type: 'sourceFile',
      };
    }
    // Otherwise, use the original resolution or default
    return originalResolveRequest
      ? originalResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
