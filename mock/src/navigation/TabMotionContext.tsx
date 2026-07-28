import { useFocusEffect } from '@react-navigation/native';
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet } from 'react-native';
import { MOTION } from '../theme/motion';

export type TabSlideDirection = 'left' | 'right' | 'none';

type TabMotionContextValue = {
  direction: TabSlideDirection;
  setTabIndex: (index: number) => void;
};

const TabMotionContext = createContext<TabMotionContextValue>({
  direction: 'none',
  setTabIndex: () => {},
});

export function TabMotionProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<TabSlideDirection>('none');
  const prevIndexRef = useRef(1);

  const setTabIndex = useCallback((index: number) => {
    const prev = prevIndexRef.current;
    if (index > prev) setDirection('right');
    else if (index < prev) setDirection('left');
    else setDirection('none');
    prevIndexRef.current = index;
  }, []);

  return (
    <TabMotionContext.Provider value={{ direction, setTabIndex }}>
      {children}
    </TabMotionContext.Provider>
  );
}

export function TabSlideScene({ children }: { children: React.ReactNode }) {
  const { direction } = useContext(TabMotionContext);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      const fromX =
        direction === 'right'
          ? MOTION.tabSlideX
          : direction === 'left'
            ? -MOTION.tabSlideX
            : 0;
      translateX.setValue(fromX);
      opacity.setValue(0.94);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: MOTION.durationNormal,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: MOTION.durationNormal,
          useNativeDriver: true,
        }),
      ]).start();
    }, [direction, opacity, translateX])
  );

  return (
    <Animated.View style={[styles.scene, { opacity, transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
  },
});

export function useTabMotion() {
  return useContext(TabMotionContext);
}
