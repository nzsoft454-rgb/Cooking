import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler';

const MIN_SCALE = 1;
const MAX_SCALE = 5;

type Props = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  accessibilityLabel: string;
  /** 変更時にズーム状態をリセット */
  resetKey: string;
};

export function ZoomableLightboxImage({
  source,
  width,
  height,
  accessibilityLabel,
  resetKey,
}: Props) {
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = useMemo(
    () => Animated.multiply(baseScale, pinchScale),
    [baseScale, pinchScale],
  );
  const lastScaleRef = useRef(1);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [panEnabled, setPanEnabled] = useState(false);

  const resetTransform = () => {
    lastScaleRef.current = 1;
    setPanEnabled(false);
    baseScale.setValue(1);
    pinchScale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
    translateX.setOffset(0);
    translateY.setOffset(0);
  };

  useEffect(() => {
    resetTransform();
  }, [resetKey]);

  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true },
  );

  const onPinchStateChange = (event: {
    nativeEvent: { oldState: number; scale: number };
  }) => {
    if (event.nativeEvent.oldState !== State.ACTIVE) return;

    let nextScale = lastScaleRef.current * event.nativeEvent.scale;
    nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    lastScaleRef.current = nextScale;
    baseScale.setValue(nextScale);
    pinchScale.setValue(1);
    setPanEnabled(nextScale > MIN_SCALE + 0.01);

    if (nextScale <= MIN_SCALE) {
      translateX.setValue(0);
      translateY.setValue(0);
      translateX.setOffset(0);
      translateY.setOffset(0);
    }
  };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true },
  );

  const onPanStateChange = (event: {
    nativeEvent: { oldState: number };
  }) => {
    if (event.nativeEvent.oldState !== State.ACTIVE) return;
    if (lastScaleRef.current <= MIN_SCALE) {
      translateX.setValue(0);
      translateY.setValue(0);
      return;
    }
    translateX.extractOffset();
    translateY.extractOffset();
  };

  return (
    <GestureHandlerRootView style={[styles.root, { width, height }]}>
      <PinchGestureHandler
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchStateChange}
      >
        <Animated.View style={styles.gestureLayer}>
          <PanGestureHandler
            enabled={panEnabled}
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanStateChange}
            minDist={4}
          >
            <Animated.View
              style={[
                styles.imageWrap,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
            >
              <Image
                source={source}
                style={{ width, height }}
                resizeMode="contain"
                accessibilityLabel={accessibilityLabel}
              />
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  gestureLayer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
