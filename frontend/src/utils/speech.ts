/**
 * Web Speech API Speech Synthesis Utility
 * Provides voice read-aloud support for Gemini AI insights and emergency recommendations.
 */

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speakText(text: string, onEnd?: () => void, onError?: () => void): void {
  if (!isSpeechSupported()) {
    console.warn('Speech synthesis not supported in this browser environment.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip markdown formatting characters for clear audio
  const cleanText = text
    .replace(/[#*_`~>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = 'en-IN'; // Indian English cadence

  // Try to pick an English voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(
    (v) => v.lang.includes('en-IN') || v.lang.includes('en-GB') || v.lang.includes('en')
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}
