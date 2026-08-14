import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager, Platform, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { hasNativeRNShare } from '../utils/share/sharePlatforms';

/** 画像ロード待ちの上限。超えたら現状の描画内容で合成する */
const READY_TIMEOUT_MS = 2500;
const READY_POLL_MS = 50;
/** レイアウト反映の猶予 */
const SETTLE_MS = 120;

export function useCookedPhotoShareCapture(imageUri: string) {
  const shareCardRef = useRef<View>(null);
  const readyRef = useRef(false);
  const needsComposite = Platform.OS === 'android' && !hasNativeRNShare();

  // 別の写真に切り替わったらロード済み状態を破棄する
  useEffect(() => {
    readyRef.current = false;
  }, [imageUri]);

  const markShareCardReady = useCallback(() => {
    readyRef.current = true;
  }, []);

  const captureShareCard = useCallback(async (): Promise<string | null> => {
    if (!needsComposite || !shareCardRef.current) return null;

    // 画像が描画される前にキャプチャすると白紙の合成画像になる
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (!readyRef.current && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
    }

    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, SETTLE_MS);
      InteractionManager.runAfterInteractions(() => {
        clearTimeout(timer);
        resolve();
      });
    });

    if (!shareCardRef.current) return null;

    return captureRef(shareCardRef, {
      format: 'jpg',
      quality: 0.92,
      result: 'tmpfile',
    });
  }, [needsComposite]);

  return {
    shareCardRef,
    needsComposite,
    markShareCardReady,
    captureShareCard,
  };
}
