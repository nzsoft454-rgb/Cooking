import type { ViewStyle } from 'react-native';

/** 控えめな UI モーション定数 */
export const MOTION = {
  durationFast: 160,
  durationNormal: 200,
  pressScale: 0.98,
  pressOpacity: 0.88,
  modalOffsetY: 14,
  modalScaleFrom: 0.98,
  tabSlideX: 28,
  backdropOpacity: 0.45,
  barSlideY: 10,
  bannerSlideY: 6,
  cardEnterOffsetY: 8,
  cardEnterStaggerMs: 22,
  cardEnterMaxDelayMs: 180,
} as const;

export function pressFeedback(pressed: boolean, disabled?: boolean): ViewStyle | undefined {
  if (!pressed || disabled) return undefined;
  return {
    opacity: MOTION.pressOpacity,
    transform: [{ scale: MOTION.pressScale }],
  };
}
