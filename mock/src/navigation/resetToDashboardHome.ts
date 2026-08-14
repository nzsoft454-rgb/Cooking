import { CommonActions, type NavigationProp } from '@react-navigation/native';
import type { CameraStackParamList } from './types';

/** 撮影〜分析フロー完了後にダッシュボード先頭へ戻す */
export function resetToDashboardHome(
  navigation: NavigationProp<CameraStackParamList>
) {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'DashboardHome' }],
    })
  );
}
