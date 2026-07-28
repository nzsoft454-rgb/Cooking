import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { MOTION } from '../../theme/motion';

/** 表示/非表示: フェード + スライド + 高さ折りたたみ（選択バーなど） */
export function SlideFadeView({
  visible,
  children,
  style,
}: {
  visible: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  const [mounted, setMounted] = useState(visible);
  const [contentHeight, setContentHeight] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-MOTION.barSlideY)).current;
  const expand = useRef(new Animated.Value(0)).current;
  const heightLocked = useRef(false);
  const exitTokenRef = useRef(0);

  useEffect(() => {
    if (!visible) return;
    exitTokenRef.current += 1;
    setMounted(true);
    opacity.stopAnimation();
    translateY.stopAnimation();
    expand.stopAnimation();
  }, [visible, opacity, translateY, expand]);

  useEffect(() => {
    if (!mounted || !visible || contentHeight <= 0) return;

    opacity.setValue(0);
    translateY.setValue(-MOTION.barSlideY);
    expand.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: MOTION.durationNormal,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: MOTION.durationNormal,
        useNativeDriver: true,
      }),
      Animated.timing(expand, {
        toValue: 1,
        duration: MOTION.durationNormal,
        useNativeDriver: false,
      }),
    ]).start();
  }, [mounted, visible, contentHeight, opacity, translateY, expand]);

  useEffect(() => {
    if (!mounted || visible || contentHeight <= 0) return;
    const token = exitTokenRef.current;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: MOTION.durationNormal,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: MOTION.barSlideY,
        duration: MOTION.durationNormal,
        useNativeDriver: true,
      }),
      Animated.timing(expand, {
        toValue: 0,
        duration: MOTION.durationNormal,
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (!finished || token !== exitTokenRef.current || visibleRef.current) return;
      heightLocked.current = false;
      setContentHeight(0);
      setMounted(false);
    });
  }, [mounted, visible, contentHeight, opacity, translateY, expand]);

  const onContentLayout = (event: LayoutChangeEvent) => {
    if (heightLocked.current) return;
    const nextHeight = event.nativeEvent.layout.height;
    if (nextHeight <= 0) return;
    heightLocked.current = true;
    setContentHeight(nextHeight);
  };

  if (!mounted) return null;

  const measured = contentHeight > 0;
  const maxHeight = measured
    ? expand.interpolate({
        inputRange: [0, 1],
        outputRange: [0, contentHeight],
      })
    : undefined;

  return (
    <Animated.View
      style={[
        style,
        measured
          ? { maxHeight, overflow: 'hidden' }
          : { opacity: 0, overflow: 'hidden' },
      ]}
    >
      <Animated.View
        style={{
          opacity: measured ? opacity : 1,
          transform: [{ translateY: measured ? translateY : 0 }],
        }}
      >
        <View onLayout={onContentLayout}>{children}</View>
      </Animated.View>
    </Animated.View>
  );
}
