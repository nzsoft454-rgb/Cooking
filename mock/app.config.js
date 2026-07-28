/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'Cooking Mock',
    slug: 'cooking-mock',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'cooking-mock',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
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
