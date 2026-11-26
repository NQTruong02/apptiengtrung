/**
 * Safe Web Speech API pronunciation helper prioritizing Taiwanese Mandarin (zh-TW).
 */
export function speakTraditionalChinese(text: string, rate = 0.88): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const twVoice =
      voices.find((v) => v.lang.toLowerCase() === 'zh-tw') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('zh-')) ||
      null;

    if (twVoice) {
      utterance.voice = twVoice;
    }
    utterance.lang = 'zh-TW';
    utterance.rate = rate;
    utterance.pitch = 1;

    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
