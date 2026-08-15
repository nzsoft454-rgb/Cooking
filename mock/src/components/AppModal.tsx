import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { MOTION } from '../theme/motion';

type Props = {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  /** 背景タップで閉じる */
  dismissOnBackdrop?: boolean;
  /** ヘッダー直下など、アンカー位置から表示 */
  anchorTop?: number;
  /** 中央（既定）または下からのシート */
  placement?: 'center' | 'bottom';
  contentStyle?: StyleProp<ViewStyle>;
};

/** 共通モーダル（フェード + 軽いスライド/スケール） */
export function AppModal({
  visible,
  onClose,
  children,
  dismissOnBackdrop = true,
  anchorTop,
  placement = 'center',
  contentStyle,
}: Props) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(MOTION.modalOffsetY)).current;
  const scale = useRef(new Animated.Value(MOTION.modalScaleFrom)).current;

  useEffect(() => {
    if (!visible) return;
    backdropOpacity.setValue(0);
    contentOpacity.setValue(0);
    translateY.setValue(MOTION.modalOffsetY);
    scale.setValue(MOTION.modalScaleFrom);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: MOTION.durationTransition,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: MOTION.durationTransition,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: MOTION.durationTransition,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: MOTION.durationTransition,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, backdropOpacity, contentOpacity, translateY, scale]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          pointerEvents={dismissOnBackdrop ? 'auto' : 'none'}
          style={[
            StyleSheet.absoluteFill,
            styles.backdrop,
            { opacity: backdropOpacity },
          ]}
        >
          {dismissOnBackdrop && onClose ? (
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
          ) : null}
        </Animated.View>

        {anchorTop != null ? (
          <Animated.View
            style={[
              styles.anchorWrap,
              { top: anchorTop, opacity: contentOpacity, transform: [{ translateY }, { scale }] },
              contentStyle,
            ]}
          >
            {children}
          </Animated.View>
        ) : (
          <View
            style={[styles.centerWrap, placement === 'bottom' && styles.bottomWrap]}
            pointerEvents="box-none"
          >
            <Animated.View
              style={[
                styles.centerContent,
                { opacity: contentOpacity, transform: [{ translateY }, { scale }] },
                contentStyle,
              ]}
            >
              {children}
            </Animated.View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: `rgba(26, 34, 40, ${MOTION.backdropOpacity})`,
  },
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    padding: 24,
  },
  bottomWrap: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  centerContent: {
    width: '100%',
  },
  anchorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
