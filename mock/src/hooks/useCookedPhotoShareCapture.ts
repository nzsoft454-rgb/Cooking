import { useCallback, useRef, useState } from 'react';
import { InteractionManager, Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { hasNativeRNShare } from '../utils/share/sharePlatforms';

export function useCookedPhotoShareCapture(imageUri: string) {
  const shareCardRef = useRef<View>(null);
  const [shareCardReady, setShareCardReady] = useState(false);
  const needsComposite = Platform.OS === 'android' && !hasNativeRNShare();

  const markShareCardReady = useCallback(() => {
    setShareCardReady(true);
  }, []);

  const captureShareCard = useCallback(async (): Promise<string | null> => {
    if (!needsComposite || !shareCardRef.current) return null;

    if (!shareCardReady) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 600);
        InteractionManager.runAfterInteractions(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    } else {
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    return captureRef(shareCardRef, {
      format: 'jpg',
      quality: 0.92,
      result: 'tmpfile',
    });
  }, [needsComposite, shareCardReady]);

  return {
    shareCardRef,
    needsComposite,
    markShareCardReady,
    captureShareCard,
  };
}
