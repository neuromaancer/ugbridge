import { useEffect, useState } from 'react';
import type { TtsProvider } from '../lib/tts';

export function useTtsStatus(tts: TtsProvider) {
  const [hasUyghurVoice, setHasUyghurVoice] = useState<boolean | null>(null);
  const isAvailable = tts.isAvailable();

  useEffect(() => {
    let cancelled = false;
    setHasUyghurVoice(null);

    if (!isAvailable) {
      setHasUyghurVoice(false);
      return () => {
        cancelled = true;
      };
    }

    tts.hasUyghurVoice().then((value) => {
      if (!cancelled) setHasUyghurVoice(value);
    });

    return () => {
      cancelled = true;
    };
  }, [tts, isAvailable]);

  return { isAvailable, hasUyghurVoice };
}
