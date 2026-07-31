/** @type {import('expo/config').ExpoConfig} */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

module.exports = {
  expo: {
    name: 'Cooking Mock',
    slug: 'cooking-mock',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'cooking-mock',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    extra: {
      geminiApiKeyConfigured: Boolean(process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim()),
    },
    android: {
      package: 'com.cookingapp.mock',
      adaptiveIcon: {
        backgroundColor: '#F5EDE4',
      },
    },
    ios: {
      bundleIdentifier: 'com.cookingapp.mock',
      supportsTablet: true,
    },
    plugins: [
      'expo-localization',
      'expo-build-properties',
      [
        'react-native-share',
        {
          ios: [],
          android: [],
          enableBase64ShareAndroid: true,
        },
      ],
    ],
  },
};
