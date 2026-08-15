import { Easing } from 'react-native';
import { MOTION } from '../theme/motion';

/** 画面遷移アニメーションの共通時間（ms） */
export const NAV_TRANSITION_DURATION = MOTION.durationTransition;

const timingSpec = {
  animation: 'timing' as const,
  config: {
    duration: NAV_TRANSITION_DURATION,
    easing: Easing.inOut(Easing.ease),
  },
};

/** ネイティブスタックの共通 transition 設定 */
export const nativeStackTransition = {
  animation: 'fade_from_bottom' as const,
  animationDuration: NAV_TRANSITION_DURATION,
};

/** ボトムタブの共通 transition 設定 */
export const bottomTabTransition = {
  animation: 'shift' as const,
  transitionSpec: timingSpec,
};
