import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Runs `task` immediately and then every `intervalMs` while the screen is
 * focused. Stops when the user navigates away, so background screens don't
 * keep hitting the API. Overlapping runs are skipped.
 */
export function usePolling(task: () => Promise<void> | void, intervalMs: number, enabled = true) {
  const taskRef = useRef(task);
  taskRef.current = task;

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      let running = false;
      const tick = async () => {
        if (running) return;
        running = true;
        try {
          await taskRef.current();
        } finally {
          running = false;
        }
      };
      void tick();
      const id = setInterval(tick, intervalMs);
      return () => clearInterval(id);
    }, [intervalMs, enabled])
  );
}
