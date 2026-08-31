import { useCallback, useEffect, useState } from 'react';

export function useSpeechGuidance(initialEnabled = true) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 1;
    utterance.volume = 0.9;
    const preferred = window.speechSynthesis.getVoices().find((voice) => /^en(-|_)/i.test(voice.lang) && /natural|enhanced|premium/i.test(voice.name))
      ?? window.speechSynthesis.getVoices().find((voice) => /^en(-|_)/i.test(voice.lang));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((value) => {
      if (value) stop();
      return !value;
    });
  }, [stop]);

  return { enabled, setEnabled, supported, speak, stop, toggle };
}
