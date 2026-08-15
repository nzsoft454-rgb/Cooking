import { CommonActions, type NavigationProp } from '@react-navigation/native';
import type { RootTabParamList } from './types';

export type CookingOrigin = 'camera' | 'fridge';

export const TAB_HOME = {
  DashboardTab: 'DashboardHome',
  FridgeTab: 'FridgeHome',
  RecipeTab: 'RecipeHome',
  SettingsTab: 'SettingsHome',
} as const;

export type RootTabName = keyof RootTabParamList;

type TabNavigation = NavigationProp<RootTabParamList>;

type StackLikeNavigation = {
  dispatch: (action: ReturnType<typeof CommonActions.reset>) => void;
};

/** 現在のスタックを指定画面だけにする */
export function resetStackTo(
  navigation: StackLikeNavigation,
  screen: string,
  params?: object
) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: params ? [{ name: screen, params }] : [{ name: screen }],
    })
  );
}

function tabStateKey(navigation: TabNavigation, tab: RootTabName): string | undefined {
  const state = navigation.getState();
  const route = state.routes.find((item) => item.name === tab);
  return route?.state?.key;
}

function currentTabName(navigation: TabNavigation): RootTabName | undefined {
  const route = navigation.getState().routes[navigation.getState().index];
  return route?.name as RootTabName | undefined;
}

/** 別タブへ即座に切り替える（スタック整理は後回し） */
export function navigateTabScreen(
  navigation: TabNavigation,
  tab: RootTabName,
  screen: string,
  params?: object
) {
  navigation.navigate(tab, { screen, params } as never);
}

/**
 * 指定タブをホーム画面だけに戻してフォーカスする。
 * 別タブからの切替は即 navigate、同一タブ再押下時のみ nested reset。
 */
export function resetTabToHome(
  navigation: TabNavigation,
  tab: RootTabName,
  params?: object
) {
  const home = TAB_HOME[tab];
  const current = currentTabName(navigation);

  if (current !== tab) {
    navigateTabScreen(navigation, tab, home, params);
    return;
  }

  const target = tabStateKey(navigation, tab);
  if (target) {
    navigation.dispatch({
      ...CommonActions.reset({
        index: 0,
        routes: params ? [{ name: home, params }] : [{ name: home }],
      }),
      target,
    });
    return;
  }

  navigateTabScreen(navigation, tab, home, params);
}

/**
 * 概要カードなどから別タブの画面を開く。
 * まずタブ切替を即実行し、必要なら次フレームでスタックを整理する。
 */
export function openTabScreen(
  navigation: TabNavigation,
  tab: RootTabName,
  screen: string,
  params?: object
) {
  navigateTabScreen(navigation, tab, screen, params);

  const home = TAB_HOME[tab];
  if (screen === home && !params) return;

  const target = tabStateKey(navigation, tab);
  if (!target) return;

  const routes =
    screen === home
      ? [params ? { name: screen, params } : { name: screen }]
      : [{ name: home }, params ? { name: screen, params } : { name: screen }];

  requestAnimationFrame(() => {
    navigation.dispatch({
      ...CommonActions.reset({
        index: routes.length - 1,
        routes,
      }),
      target,
    });
  });
}

/**
 * 画面ギャラリー向け: タブをホームから組み直してから開く。
 */
export function openTabScreenFresh(
  navigation: TabNavigation,
  tab: RootTabName,
  screen: string,
  params?: object
) {
  const home = TAB_HOME[tab];
  const routes =
    screen === home
      ? [params ? { name: screen, params } : { name: screen }]
      : [{ name: home }, params ? { name: screen, params } : { name: screen }];
  const target = tabStateKey(navigation, tab);

  if (target) {
    navigation.dispatch({
      ...CommonActions.reset({
        index: routes.length - 1,
        routes,
      }),
      target,
    });
    navigation.navigate(tab as never);
    return;
  }

  navigateTabScreen(navigation, tab, screen, params);
}

export function resetToDashboardHome(navigation: StackLikeNavigation) {
  resetStackTo(navigation, 'DashboardHome');
}

export function resetToFridgeHome(navigation: StackLikeNavigation, params?: object) {
  resetStackTo(navigation, 'FridgeHome', params);
}

export function resetToRecipeHome(
  navigation: StackLikeNavigation,
  params?: { initialTab?: 'all' | 'fav' | 'collection' }
) {
  resetStackTo(navigation, 'RecipeHome', params);
}
