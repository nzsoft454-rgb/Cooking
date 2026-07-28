import { useEffect, useRef, useState } from 'react';

export function useStepTimer() {
  const [timerStep, setTimerStep] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const startTimer = (stepNumber: number, seconds: number) => {
    setTimerStep(stepNumber);
    setRemaining(seconds);
    setRunning(true);
  };

  const resetTimer = () => {
    setRunning(false);
    setRemaining(0);
    setTimerStep(null);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return {
    timerStep,
    remaining,
    running,
    setRunning,
    startTimer,
    resetTimer,
    formatTime,
  };
}
