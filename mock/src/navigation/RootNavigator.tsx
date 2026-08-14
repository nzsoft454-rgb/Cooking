import { PlatformPressable } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnalysisResultScreen } from '../screens/camera/AnalysisResultScreen';
import { AnalyzingScreen } from '../screens/camera/AnalyzingScreen';
import { DashboardScreen } from '../screens/camera/DashboardScreen';
import { CaptureConfirmScreen } from '../screens/camera/CaptureConfirmScreen';
import { CookingConfirmScreen } from '../screens/camera/CookingConfirmScreen';
import { ManualEditScreen } from '../screens/camera/ManualEditScreen';
import { ReceiptResultScreen } from '../screens/camera/ReceiptResultScreen';
import { FridgeCookingConfirmScreen } from '../screens/fridge/FridgeCookingConfirmScreen';
import { FridgeHomeScreen } from '../screens/fridge/FridgeHomeScreen';
import { FridgeSearchScreen } from '../screens/fridge/FridgeSearchScreen';
import { IngredientBatchEditScreen } from '../screens/fridge/IngredientBatchEditScreen';
import { IngredientEditScreen } from '../screens/fridge/IngredientEditScreen';
import { RecipeDetailScreen } from '../screens/recipe/RecipeDetailScreen';
import { RecipeGeneratingScreen } from '../screens/recipe/RecipeGeneratingScreen';
import { RecipeHomeScreen } from '../screens/recipe/RecipeHomeScreen';
import { PostCookConsumeScreen } from '../screens/recipe/PostCookConsumeScreen';
import { PostCookPhotoScreen } from '../screens/recipe/PostCookPhotoScreen';
import { CookedPhotoDetailScreen } from '../screens/recipe/CookedPhotoDetailScreen';
import { ScreenGalleryScreen } from '../screens/settings/ScreenGalleryScreen';
import { SettingsHomeScreen } from '../screens/settings/SettingsHomeScreen';
import {
  HelpScreen,
  LanguageScreen,
  LegalScreen,
  LoginScreen,
  NotificationsScreen,
  PremiumScreen,
  ProfileScreen,
} from '../screens/settings/SettingsSubScreens';
import { useApp } from '../store/AppContext';
import { colors } from '../theme/colors';
import { MOTION } from '../theme/motion';
import type {
  CameraStackParamList,
  FridgeStackParamList,
  RecipeStackParamList,
  RootTabParamList,
  SettingsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const CameraStack = createNativeStackNavigator<CameraStackParamList>();
const FridgeStack = createNativeStackNavigator<FridgeStackParamList>();
const RecipeStack = createNativeStackNavigator<RecipeStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const navTheme: Theme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.bg,
    card: colors.surface,
    text: colors.ink,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '600' },
    heavy: { fontFamily: 'System', fontWeight: '700' },
  },
};

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
  },
  headerTintColor: colors.ink,
  headerTitleStyle: {
    fontWeight: '600' as const,
    fontSize: 16,
    color: colors.ink,
  },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
  animation: 'fade_from_bottom' as const,
  animationDuration: MOTION.durationNormal,
};

function CameraNavigator() {
  return (
    <CameraStack.Navigator screenOptions={stackScreenOptions}>
      <CameraStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <CameraStack.Screen
        name="CaptureConfirm"
        component={CaptureConfirmScreen}
        options={{ headerShown: false }}
      />
      <CameraStack.Screen
        name="Analyzing"
        component={AnalyzingScreen}
        options={{ headerShown: false }}
      />
      <CameraStack.Screen
        name="AnalysisResult"
        component={AnalysisResultScreen}
        options={{ headerShown: false }}
      />
      <CameraStack.Screen
        name="ManualEdit"
        component={ManualEditScreen}
        options={{ headerShown: false }}
      />
      <CameraStack.Screen
        name="ReceiptResult"
        component={ReceiptResultScreen}
        options={{ headerShown: false }}
      />
      <CameraStack.Screen
        name="CookingConfirm"
        component={CookingConfirmScreen}
        options={{ headerShown: false }}
      />
    </CameraStack.Navigator>
  );
}

function FridgeNavigator() {
  return (
    <FridgeStack.Navigator screenOptions={stackScreenOptions}>
      <FridgeStack.Screen
        name="FridgeHome"
        component={FridgeHomeScreen}
        options={{ headerShown: false }}
      />
      <FridgeStack.Screen
        name="FridgeSearch"
        component={FridgeSearchScreen}
        options={{ headerShown: false }}
      />
      <FridgeStack.Screen
        name="IngredientEdit"
        component={IngredientEditScreen}
        options={{ headerShown: false }}
      />
      <FridgeStack.Screen
        name="IngredientBatchEdit"
        component={IngredientBatchEditScreen}
        options={{ headerShown: false }}
      />
      <FridgeStack.Screen
        name="CookingConfirm"
        component={FridgeCookingConfirmScreen}
        options={{ headerShown: false }}
      />
    </FridgeStack.Navigator>
  );
}

function RecipeNavigator() {
  const { t } = useTranslation();

  return (
    <RecipeStack.Navigator screenOptions={stackScreenOptions}>
      <RecipeStack.Screen
        name="RecipeHome"
        component={RecipeHomeScreen}
        options={{ headerShown: false }}
      />
      <RecipeStack.Screen
        name="RecipeGenerating"
        component={RecipeGeneratingScreen}
        options={{ headerShown: false }}
      />
      <RecipeStack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{ headerShown: false }}
      />
      <RecipeStack.Screen
        name="PostCookConsume"
        component={PostCookConsumeScreen}
        options={{ headerShown: false }}
      />
      <RecipeStack.Screen
        name="PostCookPhoto"
        component={PostCookPhotoScreen}
        options={{ headerShown: false }}
      />
      <RecipeStack.Screen
        name="CookedPhotoDetail"
        component={CookedPhotoDetailScreen}
        options={{ headerShown: false }}
      />
    </RecipeStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={stackScreenOptions}>
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="ScreenGallery"
        component={ScreenGalleryScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen name="Legal" component={LegalScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="Language" component={LanguageScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="Help" component={HelpScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="Premium" component={PremiumScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    </SettingsStack.Navigator>
  );
}

function NavigationRoot() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBottomPad = Math.max(insets.bottom, 10) + 14;
  const tabBarHeight = 52 + tabBottomPad;

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        initialRouteName="DashboardTab"
        screenOptions={({ route }) => ({
          headerShown: false,
          animation: 'shift',
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.2,
          },
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: tabBarHeight,
            paddingBottom: tabBottomPad,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarButton: (props) => (
            <PlatformPressable
              {...props}
              pressColor="transparent"
              pressOpacity={MOTION.pressOpacity}
            />
          ),
          tabBarIcon: ({ color, size }) => {
            const map: Record<string, keyof typeof Ionicons.glyphMap> = {
              DashboardTab: 'home-outline',
              FridgeTab: 'grid-outline',
              RecipeTab: 'restaurant-outline',
              SettingsTab: 'settings-outline',
            };
            return <Ionicons name={map[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen
          name="DashboardTab"
          component={CameraNavigator}
          options={{ title: t('tabs.dashboard') }}
        />
        <Tab.Screen
          name="FridgeTab"
          component={FridgeNavigator}
          options={{ title: t('tabs.fridge') }}
        />
        <Tab.Screen
          name="RecipeTab"
          component={RecipeNavigator}
          options={{ title: t('tabs.recipe') }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsNavigator}
          options={{ title: t('tabs.settings') }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export function RootNavigator() {
  const { ready } = useApp();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <NavigationRoot />;
}
