import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { MOTION } from '../../theme/motion';

/** タブ切替・ステップ切替などの控えめフェード */
export function FadeInView({
  children,
  contentKey,
  style,
}: {
  children: React.ReactNode;
  contentKey?: string | number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    opacity.setValue(0.93);
    Animated.timing(opacity, {
      toValue: 1,
      duration: MOTION.durationTransition,
      useNativeDriver: true,
    }).start();
  }, [contentKey, opacity]);

  return (
    <Animated.View style={[styles.fadeIn, style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fadeIn: {
    flex: 1,
  },
});
